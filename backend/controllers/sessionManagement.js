const Session = require('../models/Session');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const ErrorResponse = require('../utils/errorResponse');
const RolloverRun = require('../models/RolloverRun');

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

// @desc    Complete promotion rollover: create next session, copy classes, move promoted students
// @route   POST /api/sessions/:sessionId/auto-rollover
// @access  Private (Admin, Principal)
exports.rolloverSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const source = await Session.findById(sessionId);
    if (!source) {
      return next(new ErrorResponse('Session not found', 404));
    }

    // Prevent concurrent runs for the same source session
    const existingActive = await RolloverRun.findOne({ sourceSessionName: source.name, status: 'running' });
    if (existingActive) {
      return next(new ErrorResponse('A rollover is already running for this session', 409));
    }

    const run = await RolloverRun.create({ sourceSessionName: source.name, status: 'running' });

    // Derive next session name and academic year
    const deriveNext = (name, academicYear) => {
      const yearRange = /^(\d{4})[-/](\d{4})$/;
      const singleYear = /^(\d{4})$/;
      let nextName = '';
      let nextAcademicYear = '';
      if (yearRange.test(academicYear)) {
        const [, y1, y2] = academicYear.match(yearRange);
        const ny1 = String(Number(y1) + 1);
        const ny2 = String(Number(y2) + 1);
        nextAcademicYear = `${ny1}-${ny2}`;
      } else if (singleYear.test(academicYear)) {
        nextAcademicYear = String(Number(academicYear) + 1);
      } else {
        nextAcademicYear = academicYear;
      }
      if (yearRange.test(name)) {
        const [, y1, y2] = name.match(yearRange);
        nextName = `${Number(y1) + 1}-${Number(y2) + 1}`;
      } else if (singleYear.test(name)) {
        nextName = String(Number(name) + 1);
      } else {
        nextName = `${name}-next`;
      }
      return { nextName, nextAcademicYear };
    };

    const { nextName, nextAcademicYear } = deriveNext(source.name, source.academicYear);

    // Compute dates (start day after source endDate, end one year later)
    const startDate = new Date((source.endDate || new Date()).getTime() + 24*60*60*1000);
    const endDate = new Date(startDate.getTime());
    endDate.setFullYear(endDate.getFullYear() + 1);
    endDate.setDate(endDate.getDate() - 1);

    // Create next session
    const newSession = await Session.create({
      name: nextName,
      academicYear: nextAcademicYear,
      startDate,
      endDate,
      description: source.description || '',
      promotionCriteria: source.promotionCriteria,
      isCurrent: true,
      status: 'active'
    });
    await Session.updateMany({ _id: { $ne: newSession._id } }, { isCurrent: false });

    // Copy classes from source session into new session
    const sourceClasses = await Class.find({ session: source.name });
    const createdClasses = [];
    for (const sc of sourceClasses) {
      const exists = await Class.findOne({ name: sc.name, section: sc.section, session: newSession.name });
      if (!exists) {
        const nc = await Class.create({
          name: sc.name,
          section: sc.section,
          academicYear: newSession.academicYear,
          session: newSession.name,
          capacity: sc.capacity,
          roomNumber: sc.roomNumber,
          isActiveSession: true
        });
        createdClasses.push(nc);
      }
    }

    // Promote and move eligible students
    const students = await Student.find({ currentSession: source.name, deletedAt: null });
    const gradeMap = { nursery: 'lkg', lkg: 'ukg', ukg: '1', '1': '2', '2': '3', '3': '4', '4': '5', '5': '6', '6': '7', '7': '8', '8': '9', '9': '10', '10': '11', '11': '12' };
    let promotedCount = 0;
    let retainedCount = 0;
    for (const student of students) {
      // Attendance-based eligibility
      const attendance = await Attendance.find({ studentId: student._id, session: source.name });
      const total = attendance.length;
      const present = attendance.filter(a => a.status === 'present').length;
      const percentage = total > 0 ? (present / total) * 100 : 0;
      const eligible = percentage >= (source.promotionCriteria?.minimumAttendance || 0);

      if (eligible) {
        const nextGrade = gradeMap[student.grade];
        if (nextGrade) {
          student.previousGrade = student.grade;
          student.previousSection = student.section;
          student.grade = nextGrade;
          // Keep same section by default
          student.section = student.section || 'A';
          student.promotionStatus = 'promoted';
          student.promotionDate = new Date();
          student.promotionNotes = 'Auto rollover';
          student.currentSession = newSession.name;
          promotedCount++;
        } else {
          // Graduating (no next grade)
          student.promotionStatus = 'graduated';
          student.previousGrade = student.grade;
          student.previousSection = student.section;
          student.grade = 'graduated';
          student.section = 'N/A';
          student.currentSession = null;
          promotedCount++;
        }
      } else {
        student.promotionStatus = 'retained';
        student.promotionNotes = 'Below attendance criteria';
        // Remain in source session
        retainedCount++;
      }
      await student.save();
    }

    // Deactivate source session classes
    await Class.updateMany({ session: source.name }, { isActiveSession: false, sessionEndDate: new Date() });

    run.status = 'completed';
    run.targetSessionName = newSession.name;
    run.counts = { classesCopied: createdClasses.length, promoted: promotedCount, retained: retainedCount };
    run.finishedAt = new Date();
    await run.save();

    res.status(200).json({
      success: true,
      message: 'Auto rollover completed',
      data: {
        sourceSession: source.name,
        newSession: newSession.name,
        classesCopied: createdClasses.length,
        promoted: promotedCount,
        retained: retainedCount
      }
    });
  } catch (err) {
    try {
      // Best-effort mark run as failed
      const { sessionId } = req.params;
      const source = await Session.findById(sessionId);
      if (source) {
        const run = await RolloverRun.findOne({ sourceSessionName: source.name, status: 'running' });
        if (run) {
          run.status = 'failed';
          run.message = err.message;
          run.finishedAt = new Date();
          await run.save();
        }
      }
    } catch (_) {}
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