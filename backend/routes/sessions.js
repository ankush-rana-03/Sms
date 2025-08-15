const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

// Get all sessions
router.get('/', protect, async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});

// Get current session
router.get('/current', protect, async (req, res) => {
  try {
    const currentSession = await Session.findOne({ isCurrent: true });
    res.json(currentSession);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching current session', error: error.message });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    const { name, academicYear, startDate, endDate, description, promotionCriteria } = req.body;

    console.log('Session creation request:', req.body);

    // Check if session name already exists
    const existingSession = await Session.findOne({ name });
    if (existingSession) {
      return res.status(400).json({ message: 'Session with this name already exists' });
    }

    const session = new Session({
      name,
      academicYear,
      startDate,
      endDate,
      description,
      promotionCriteria,
      createdBy: null, // Remove user requirement for testing
      isCurrent: true // This will automatically set other sessions to false
    });

    console.log('Saving session:', session);
    await session.save();
    console.log('Session saved successfully');
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
});

// Update session
router.put('/:id', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const { name, academicYear, startDate, endDate, description, promotionCriteria, status } = req.body;
    
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update fields
    if (name) session.name = name;
    if (academicYear) session.academicYear = academicYear;
    if (startDate) session.startDate = startDate;
    if (endDate) session.endDate = endDate;
    if (description !== undefined) session.description = description;
    if (promotionCriteria) session.promotionCriteria = promotionCriteria;
    if (status) session.status = status;

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error updating session', error: error.message });
  }
});

// Set session as current
router.patch('/:id/set-current', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.isCurrent = true;
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error setting current session', error: error.message });
  }
});

// Process student promotions
router.post('/:id/process-promotions', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const students = await Student.find({ currentSession: session.name });
    const results = await Result.find({ session: session.name });
    const attendanceRecords = await Attendance.find({ session: session.name });

    const promotionResults = [];

    for (const student of students) {
      // Calculate attendance percentage
      const studentAttendance = attendanceRecords.filter(att => 
        att.studentId.toString() === student._id.toString()
      );
      const attendancePercentage = studentAttendance.length > 0 
        ? (studentAttendance.filter(att => att.status === 'present').length / studentAttendance.length) * 100
        : 0;

      // Get student results
      const studentResults = results.filter(result => 
        result.studentId.toString() === student._id.toString()
      );

      // Determine promotion status based on criteria
      let promotionStatus = 'retained';
      let promotionNotes = '';

      if (attendancePercentage >= session.promotionCriteria.minimumAttendance) {
        // Check if student has passing grades
        const hasPassingGrades = studentResults.every(result => {
          const grade = result.grade || result.percentage;
          if (typeof grade === 'number') {
            return grade >= 40; // Assuming 40% is passing
          }
          // For letter grades, check if it's better than minimum
          const gradeOrder = ['F', 'E', 'D', 'C', 'B', 'A'];
          const gradeIndex = gradeOrder.indexOf(grade);
          const minIndex = gradeOrder.indexOf(session.promotionCriteria.minimumGrade);
          return gradeIndex >= minIndex;
        });

        if (hasPassingGrades) {
          promotionStatus = 'promoted';
          promotionNotes = 'Student meets all promotion criteria';
        } else {
          promotionStatus = 'retained';
          promotionNotes = 'Student does not meet minimum grade requirements';
        }
      } else {
        promotionStatus = 'retained';
        promotionNotes = `Attendance below minimum requirement (${attendancePercentage.toFixed(1)}% < ${session.promotionCriteria.minimumAttendance}%)`;
      }

      // Update student promotion status
      student.promotionStatus = promotionStatus;
      student.promotionDate = new Date();
      student.promotionNotes = promotionNotes;
      await student.save();

      promotionResults.push({
        studentId: student._id,
        studentName: student.name,
        grade: student.grade,
        section: student.section,
        attendancePercentage,
        promotionStatus,
        promotionNotes
      });
    }

    res.json({
      message: 'Promotion processing completed',
      session: session.name,
      totalStudents: students.length,
      results: promotionResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing promotions', error: error.message });
  }
});

// Archive session data
router.post('/:id/archive', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Archive students
    const students = await Student.find({ currentSession: session.name });
    const archivedStudents = students.map(student => ({
      studentId: student._id,
      finalGrade: student.grade,
      promotionStatus: student.promotionStatus,
      attendancePercentage: student.attendance.length > 0 
        ? (student.attendance.filter(att => att.status === 'present').length / student.attendance.length) * 100
        : 0,
      archivedAt: new Date()
    }));

    // Archive classes
    const classes = await Class.find({ session: session.name });
    const archivedClasses = classes.map(cls => ({
      classId: cls._id,
      archivedAt: new Date()
    }));

    // Update session with archived data
    session.archivedData = {
      students: archivedStudents,
      classes: archivedClasses
    };
    session.status = 'archived';
    session.isCurrent = false;
    await session.save();

    res.json({
      message: 'Session archived successfully',
      archivedStudents: archivedStudents.length,
      archivedClasses: archivedClasses.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error archiving session', error: error.message });
  }
});

// Fresh start - prepare for new session
router.post('/:id/fresh-start', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get promoted students
    const promotedStudents = await Student.find({ 
      currentSession: session.name,
      promotionStatus: 'promoted'
    });

    // Update promoted students for new session
    for (const student of promotedStudents) {
      student.previousGrade = student.grade;
      student.previousSection = student.section;
      
      // Increment grade (simple logic - you might want to customize this)
      const gradeNumber = parseInt(student.grade);
      if (!isNaN(gradeNumber)) {
        student.grade = (gradeNumber + 1).toString();
      }
      
      student.currentSession = null; // Will be set when new session is created
      student.promotionStatus = 'pending';
      student.promotionDate = null;
      student.promotionNotes = '';
      await student.save();
    }

    // Deactivate current classes
    await Class.updateMany(
      { session: session.name },
      { isActiveSession: false, sessionEndDate: new Date() }
    );

    res.json({
      message: 'Fresh start completed',
      promotedStudents: promotedStudents.length,
      session: session.name
    });
  } catch (error) {
    res.status(500).json({ message: 'Error preparing fresh start', error: error.message });
  }
});

// Get session statistics
router.get('/:id/statistics', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const students = await Student.find({ currentSession: session.name });
    const classes = await Class.find({ session: session.name });
    const results = await Result.find({ session: session.name });

    const statistics = {
      totalStudents: students.length,
      totalClasses: classes.length,
      totalResults: results.length,
      promotionBreakdown: {
        promoted: students.filter(s => s.promotionStatus === 'promoted').length,
        retained: students.filter(s => s.promotionStatus === 'retained').length,
        graduated: students.filter(s => s.promotionStatus === 'graduated').length,
        pending: students.filter(s => s.promotionStatus === 'pending').length
      },
      averageAttendance: students.length > 0 
        ? students.reduce((acc, student) => {
            const attendance = student.attendance || [];
            const percentage = attendance.length > 0 
              ? (attendance.filter(att => att.status === 'present').length / attendance.length) * 100
              : 0;
            return acc + percentage;
          }, 0) / students.length
        : 0
    };

    res.json(statistics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session statistics', error: error.message });
  }
});

// Delete session (only if archived)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.status !== 'archived') {
      return res.status(400).json({ message: 'Can only delete archived sessions' });
    }

    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
});

module.exports = router;