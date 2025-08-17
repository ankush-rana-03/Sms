const Student = require('../models/Student');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Evaluate student promotion eligibility
// @route   POST /api/promotion/evaluate/:sessionId
// @access  Private (Admin, Principal)
exports.evaluatePromotions = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { autoPromote = false } = req.body;

    // Find the session
    const session = await Session.findById(sessionId);
    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    if (session.status !== 'completed') {
      return next(new ErrorResponse('Session must be completed before evaluating promotions', 400));
    }

    // Get all students in this session
    const students = await Student.find({ 
      currentSession: session.name,
      deletedAt: null 
    });

    const promotionResults = [];
    const errors = [];

    for (const student of students) {
      try {
        const evaluation = await evaluateStudentPromotion(student, session);
        promotionResults.push(evaluation);

        if (autoPromote && evaluation.eligible) {
          await promoteStudent(student, evaluation);
        }
      } catch (error) {
        errors.push({
          studentId: student._id,
          studentName: student.name,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        session: session.name,
        totalStudents: students.length,
        promotionResults,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Promotion evaluation completed for ${students.length} students`
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Promote specific student
// @route   POST /api/promotion/promote/:studentId
// @access  Private (Admin, Principal)
exports.promoteStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { nextGrade, nextSection, notes } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Evaluate promotion eligibility
    const session = await Session.findOne({ name: student.currentSession });
    if (!session) {
      return next(new ErrorResponse('Student session not found', 404));
    }

    const evaluation = await evaluateStudentPromotion(student, session);
    if (!evaluation.eligible) {
      return next(new ErrorResponse(`Student not eligible for promotion: ${evaluation.reason}`, 400));
    }

    // Perform promotion
    const promotionResult = await promoteStudent(student, evaluation, nextGrade, nextSection, notes);

    res.status(200).json({
      success: true,
      data: promotionResult,
      message: 'Student promoted successfully'
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get promotion status for a session
// @route   GET /api/promotion/status/:sessionId
// @access  Private (Admin, Principal)
exports.getPromotionStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    // Get promotion statistics
    const students = await Student.find({ 
      currentSession: session.name,
      deletedAt: null 
    });

    const promotionStats = {
      total: students.length,
      promoted: students.filter(s => s.promotionStatus === 'promoted').length,
      retained: students.filter(s => s.promotionStatus === 'retained').length,
      pending: students.filter(s => s.promotionStatus === 'pending').length,
      graduated: students.filter(s => s.promotionStatus === 'graduated').length
    };

    // Get grade-wise breakdown
    const gradeBreakdown = {};
    students.forEach(student => {
      if (!gradeBreakdown[student.grade]) {
        gradeBreakdown[student.grade] = {
          total: 0,
          promoted: 0,
          retained: 0,
          pending: 0
        };
      }
      gradeBreakdown[student.grade].total++;
      gradeBreakdown[student.grade][student.promotionStatus]++;
    });

    res.status(200).json({
      success: true,
      data: {
        session: session.name,
        status: session.status,
        promotionStats,
        gradeBreakdown
      }
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Bulk promote students
// @route   POST /api/promotion/bulk-promote
// @access  Private (Admin, Principal)
exports.bulkPromote = async (req, res, next) => {
  try {
    const { sessionId, studentIds, nextGrade, nextSection, notes } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const student = await Student.findById(studentId);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        if (student.currentSession !== session.name) {
          errors.push({ studentId, error: 'Student not in specified session' });
          continue;
        }

        const evaluation = await evaluateStudentPromotion(student, session);
        if (!evaluation.eligible) {
          errors.push({ studentId, error: `Not eligible: ${evaluation.reason}` });
          continue;
        }

        const promotionResult = await promoteStudent(student, evaluation, nextGrade, nextSection, notes);
        results.push(promotionResult);

      } catch (error) {
        errors.push({ studentId, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        session: session.name,
        promoted: results.length,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Bulk promotion completed. ${results.length} students promoted successfully.`
    });

  } catch (err) {
    next(err);
  }
};

// Helper function to evaluate student promotion eligibility
async function evaluateStudentPromotion(student, session) {
  const criteria = session.promotionCriteria;
  
  // Calculate attendance percentage
  const attendanceRecords = await Attendance.find({
    studentId: student._id,
    session: session.name
  });

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Check attendance criteria
  if (attendancePercentage < criteria.minimumAttendance) {
    return {
      eligible: false,
      reason: `Attendance below minimum requirement (${attendancePercentage.toFixed(1)}% < ${criteria.minimumAttendance}%)`,
      attendancePercentage,
      totalDays,
      presentDays
    };
  }

  // For now, we'll assume grade criteria is met
  // In a real system, you'd check actual test results here
  const gradeMet = true; // Placeholder for grade evaluation

  if (!gradeMet) {
    return {
      eligible: false,
      reason: `Grade below minimum requirement`,
      attendancePercentage,
      totalDays,
      presentDays
    };
  }

  return {
    eligible: true,
    reason: 'All criteria met',
    attendancePercentage,
    totalDays,
    presentDays,
    gradeMet
  };
}

// Helper function to promote a student
async function promoteStudent(student, evaluation, nextGrade = null, nextSection = null, notes = '') {
  // Determine next grade if not specified
  if (!nextGrade) {
    const gradeOrder = ['nursery', 'lkg', 'ukg', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const currentIndex = gradeOrder.indexOf(student.grade);
    
    if (currentIndex === -1 || currentIndex === gradeOrder.length - 1) {
      // Student is graduating
      student.promotionStatus = 'graduated';
      student.previousGrade = student.grade;
      student.previousSection = student.section;
      student.grade = 'graduated';
      student.section = 'N/A';
    } else {
      // Promote to next grade
      student.promotionStatus = 'promoted';
      student.previousGrade = student.grade;
      student.previousSection = student.section;
      student.grade = gradeOrder[currentIndex + 1];
      student.section = nextSection || 'A'; // Default to section A
    }
  } else {
    // Use specified grade and section
    student.promotionStatus = 'promoted';
    student.previousGrade = student.grade;
    student.previousSection = student.section;
    student.grade = nextGrade;
    student.section = nextSection || 'A';
  }

  student.promotionDate = new Date();
  student.promotionNotes = notes;
  student.currentSession = null; // Will be set when enrolled in new session

  await student.save();

  return {
    studentId: student._id,
    studentName: student.name,
    previousGrade: student.previousGrade,
    previousSection: student.previousSection,
    newGrade: student.grade,
    newSection: student.section,
    promotionStatus: student.promotionStatus,
    promotionDate: student.promotionDate,
    evaluation
  };
}