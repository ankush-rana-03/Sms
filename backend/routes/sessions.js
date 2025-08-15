const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const TeacherAssignment = require('../models/TeacherAssignment');
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
      
      // Increment grade/class (handle nursery, lkg, ukg, and numeric grades)
      const gradeMap = {
        'nursery': 'lkg',
        'lkg': 'ukg',
        'ukg': '1',
        '1': '2', '2': '3', '3': '4', '4': '5', '5': '6', '6': '7', '7': '8', '8': '9', '9': '10', '10': '11', '11': '12'
      };
      
      if (gradeMap[student.grade]) {
        student.grade = gradeMap[student.grade];
      }
      // If grade is '12', student graduates (no further promotion)
      
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

// Auto-create classes for new session from template
router.post('/:id/auto-create-classes', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const { classTemplate } = req.body;
    
    // Default class template if not provided
    const defaultTemplate = [
      { name: 'nursery', sections: ['A', 'B', 'C'], capacity: 25 },
      { name: 'lkg', sections: ['A', 'B', 'C'], capacity: 25 },
      { name: 'ukg', sections: ['A', 'B', 'C'], capacity: 25 },
      { name: '1', sections: ['A', 'B'], capacity: 30 },
      { name: '2', sections: ['A', 'B'], capacity: 30 },
      { name: '3', sections: ['A', 'B'], capacity: 30 },
      { name: '4', sections: ['A', 'B'], capacity: 30 },
      { name: '5', sections: ['A', 'B'], capacity: 30 },
      { name: '6', sections: ['A', 'B'], capacity: 30 },
      { name: '7', sections: ['A', 'B'], capacity: 30 },
      { name: '8', sections: ['A', 'B'], capacity: 30 },
      { name: '9', sections: ['A', 'B'], capacity: 30 },
      { name: '10', sections: ['A', 'B'], capacity: 30 },
      { name: '11', sections: ['A', 'B'], capacity: 30 },
      { name: '12', sections: ['A', 'B'], capacity: 30 }
    ];

    const template = classTemplate || defaultTemplate;
    const createdClasses = [];

    for (const classConfig of template) {
      for (const section of classConfig.sections) {
        // Check if class already exists
        const existingClass = await Class.findOne({
          name: classConfig.name,
          section: section,
          session: session.name
        });

        if (!existingClass) {
          const newClass = await Class.create({
            name: classConfig.name,
            section: section,
            academicYear: session.academicYear,
            session: session.name,
            capacity: classConfig.capacity || 30,
            roomNumber: `${classConfig.name.toUpperCase()}${section}`,
            isActiveSession: true
          });
          createdClasses.push(newClass);
        }
      }
    }

    res.json({
      message: 'Classes auto-created successfully',
      session: session.name,
      createdClasses: createdClasses.length,
      classes: createdClasses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error auto-creating classes', error: error.message });
  }
});

// Copy classes from previous session
router.post('/:id/copy-classes-from/:sourceSessionId', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const targetSession = await Session.findById(req.params.id);
    const sourceSession = await Session.findById(req.params.sourceSessionId);
    
    if (!targetSession) {
      return res.status(404).json({ message: 'Target session not found' });
    }
    
    if (!sourceSession) {
      return res.status(404).json({ message: 'Source session not found' });
    }

    // Get classes from source session
    const sourceClasses = await Class.find({ session: sourceSession.name });
    
    if (sourceClasses.length === 0) {
      return res.status(400).json({ 
        message: `No classes found in source session: ${sourceSession.name}` 
      });
    }

    const copiedClasses = [];
    const skippedClasses = [];

    for (const sourceClass of sourceClasses) {
      // Check if class already exists in target session
      const existingClass = await Class.findOne({
        name: sourceClass.name,
        section: sourceClass.section,
        session: targetSession.name
      });

      if (existingClass) {
        skippedClasses.push({
          name: sourceClass.name,
          section: sourceClass.section,
          reason: 'Already exists'
        });
        continue;
      }

      // Create new class in target session
      const newClass = await Class.create({
        name: sourceClass.name,
        section: sourceClass.section,
        academicYear: targetSession.academicYear,
        session: targetSession.name,
        capacity: sourceClass.capacity,
        roomNumber: sourceClass.roomNumber,
        isActiveSession: true
      });

      copiedClasses.push(newClass);
    }

    res.json({
      message: 'Classes copied successfully',
      targetSession: targetSession.name,
      sourceSession: sourceSession.name,
      copiedClasses: copiedClasses.length,
      skippedClasses: skippedClasses.length,
      classes: copiedClasses,
      skipped: skippedClasses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error copying classes', error: error.message });
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

// Delete all classes from a session
router.delete('/:id/classes', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Get all classes for this session
    const classes = await Class.find({ session: session.name });
    
    if (classes.length === 0) {
      return res.status(400).json({ 
        message: `No classes found in session: ${session.name}` 
      });
    }

    // Get class IDs for cleanup
    const classIds = classes.map(cls => cls._id);

    // Delete all teacher assignments for these classes
    await TeacherAssignment.deleteMany({ 
      class: { $in: classIds } 
    });

    // Delete all classes
    await Class.deleteMany({ session: session.name });

    res.json({
      message: 'All classes deleted successfully',
      session: session.name,
      deletedClasses: classes.length,
      deletedAssignments: classIds.length // This will be the count of classes that had assignments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting classes', error: error.message });
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