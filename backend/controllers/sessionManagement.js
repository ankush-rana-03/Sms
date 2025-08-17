const Session = require('../models/Session');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Complete a session
// @route   PUT /api/sessions/:sessionId/complete
// @access  Private (Admin, Principal)
exports.completeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { autoPromote = false } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    if (session.status === 'completed') {
      return next(new ErrorResponse('Session is already completed', 400));
    }

    if (session.status === 'archived') {
      return next(new ErrorResponse('Cannot complete an archived session', 400));
    }

    // Update session status
    session.status = 'completed';
    session.isCurrent = false;
    session.endDate = new Date();

    await session.save();

    // If auto-promote is enabled, trigger promotion evaluation
    let promotionMessage = '';
    if (autoPromote) {
      try {
        // Import promotion controller dynamically to avoid circular dependency
        const { evaluatePromotions } = require('./promotion');
        
        // Trigger promotion evaluation
        const promotionResult = await evaluatePromotions({ 
          params: { sessionId }, 
          body: { autoPromote: true } 
        }, res, next);

        if (promotionResult) {
          promotionMessage = ` and ${promotionResult.data.promoted} students promoted`;
        }
      } catch (error) {
        console.error('Auto-promotion failed:', error);
        promotionMessage = ' but auto-promotion failed';
      }
    }

    res.status(200).json({
      success: true,
      data: {
        session: session.name,
        status: session.status,
        endDate: session.endDate,
        autoPromote
      },
      message: `Session ${session.name} completed successfully${promotionMessage}`
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Archive a completed session
// @route   PUT /api/sessions/:sessionId/archive
// @access  Private (Admin, Principal)
exports.archiveSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    if (session.status !== 'completed') {
      return next(new ErrorResponse('Only completed sessions can be archived', 400));
    }

    // Archive session data
    const students = await Student.find({ 
      currentSession: session.name,
      deletedAt: null 
    });

    const classes = await Class.find({ 
      session: session.name 
    });

    // Update session with archived data
    session.status = 'archived';
    session.archivedData = {
      students: students.map(student => ({
        studentId: student._id,
        finalGrade: student.grade,
        promotionStatus: student.promotionStatus,
        attendancePercentage: 0 // Will be calculated if needed
      })),
      classes: classes.map(cls => ({
        classId: cls._id
      }))
    };

    await session.save();

    res.status(200).json({
      success: true,
      data: {
        session: session.name,
        status: session.status,
        archivedStudents: students.length,
        archivedClasses: classes.length
      },
      message: `Session ${session.name} archived successfully with ${students.length} students and ${classes.length} classes`
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Start a new session
// @route   POST /api/sessions/start
// @access  Private (Admin, Principal)
exports.startNewSession = async (req, res, next) => {
  try {
    const { name, academicYear, startDate, endDate, description } = req.body;

    // Validate required fields
    if (!name || !academicYear || !startDate || !endDate) {
      return next(new ErrorResponse('Please provide name, academicYear, startDate, and endDate', 400));
    }

    // Check if session name already exists
    const existingSession = await Session.findOne({ name });
    if (existingSession) {
      return next(new ErrorResponse('Session with this name already exists', 400));
    }

    // Create new session
    const newSession = await Session.create({
      name,
      academicYear,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: description || '',
      isCurrent: true,
      status: 'active'
    });

    // Update other sessions to not be current
    await Session.updateMany(
      { _id: { $ne: newSession._id } },
      { isCurrent: false }
    );

    res.status(201).json({
      success: true,
      data: newSession,
      message: `New session ${name} started successfully`
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get session analytics
// @route   GET /api/sessions/:sessionId/analytics
// @access  Private (Admin, Principal)
exports.getSessionAnalytics = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    // Get session statistics
    const students = await Student.find({ 
      currentSession: session.name,
      deletedAt: null 
    });

    const classes = await Class.find({ session: session.name });
    
    const attendanceRecords = await Attendance.find({ session: session.name });

    // Calculate analytics
    const analytics = {
      session: session.name,
      status: session.status,
      startDate: session.startDate,
      endDate: session.endDate,
      students: {
        total: students.length,
        byGrade: {},
        byPromotionStatus: {}
      },
      classes: {
        total: classes.length,
        byGrade: {}
      },
      attendance: {
        totalRecords: attendanceRecords.length,
        averageAttendance: 0
      }
    };

    // Grade-wise student breakdown
    students.forEach(student => {
      if (!analytics.students.byGrade[student.grade]) {
        analytics.students.byGrade[student.grade] = 0;
      }
      analytics.students.byGrade[student.grade]++;

      if (!analytics.students.byPromotionStatus[student.promotionStatus]) {
        analytics.students.byPromotionStatus[student.promotionStatus] = 0;
      }
      analytics.students.byPromotionStatus[student.promotionStatus]++;
    });

    // Grade-wise class breakdown
    classes.forEach(cls => {
      if (!analytics.classes.byGrade[cls.name]) {
        analytics.classes.byGrade[cls.name] = 0;
      }
      analytics.classes.byGrade[cls.name]++;
    });

    // Calculate average attendance
    if (attendanceRecords.length > 0) {
      const totalPresent = attendanceRecords.filter(a => a.status === 'present').length;
      analytics.attendance.averageAttendance = (totalPresent / attendanceRecords.length) * 100;
    }

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (err) {
    next(err);
  }
};