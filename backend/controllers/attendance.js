const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const ErrorResponse = require('../utils/errorResponse');
const { validateAttendanceDate, canEditAttendance } = require('../utils/dateValidation');
const mongoose = require('mongoose'); // Added for session management


// @desc    Mark attendance manually
// @route   POST /api/attendance/mark
// @access  Private (Teacher only)
exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, status, date, remarks, session: sessionFromBody } = req.body;

    // Validate date based on user role
    const dateValidation = validateAttendanceDate(date || new Date(), req.user.role);
    if (!dateValidation.isValid) {
      return next(new ErrorResponse(dateValidation.message, 400));
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Resolve session to use in strict priority: request -> student.currentSession -> current Session document
    let sessionName = sessionFromBody;
    if (!sessionName) {
      sessionName = student.currentSession || null;
      if (!sessionName) {
        const currentSessionDoc = await mongoose.model('Session').findOne({ isCurrent: true });
        sessionName = currentSessionDoc?.name || null;
      }
    }

    if (!sessionName) {
      return next(new ErrorResponse('No active session found to record attendance', 400));
    }

    // Find class based on student's grade and section for the resolved session
    let classData = await Class.findOne({
      name: student.grade,
      section: student.section,
      session: sessionName
    });

    if (!classData) {
      // Auto-create class for this session if missing
      const sessionDoc = await mongoose.model('Session').findOne({ name: sessionName });
      classData = await Class.create({
        name: student.grade,
        section: student.section,
        academicYear: sessionDoc?.academicYear || sessionName,
        session: sessionName,
        capacity: 30,
        isActiveSession: true
      });
    }

    // Check if attendance already marked for the specified date and session
    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      studentId: studentId,
      session: sessionName,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return next(new ErrorResponse('Attendance already marked for this date', 400));
    }

    // Create attendance record
    const attendance = await Attendance.create({
      studentId: studentId,
      classId: classData._id,
      session: sessionName,
      date: attendanceDate,
      status,
      markedBy: req.user.id,
      remarks
    });

    // Notifications disabled (WhatsApp removed)

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance by date
// @route   GET /api/attendance/date/:date
// @access  Private
exports.getAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { classId, session } = req.query;

    const query = {
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      }
    };

    if (classId) {
      query.classId = classId;
    }

    // If session is specified, filter by it; otherwise require current session
    if (session) {
      query.session = session;
    } else {
      const currentSession = await mongoose.model('Session').findOne({ isCurrent: true });
      if (!currentSession) {
        return next(new ErrorResponse('No active session found', 400));
      }
      query.session = currentSession.name;
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name rollNumber')
      .populate('classId', 'name section')
      .populate('markedBy', 'name');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
      session: query.session || 'Not specified'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance records (list) with filters
// @route   GET /api/attendance/records
// @access  Private
exports.getAttendanceRecords = async (req, res, next) => {
  try {
    const { session, classId, grade, section, startDate, endDate } = req.query;

    const query = {};
    if (session) {
      query.session = session;
    } else {
      const currentSession = await mongoose.model('Session').findOne({ isCurrent: true });
      if (!currentSession) {
        return next(new ErrorResponse('No active session found', 400));
      }
      query.session = currentSession.name;
    }
    if (classId) query.classId = classId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fallback: resolve classId by grade/section/session
    if (!classId && grade) {
      const cls = await mongoose.model('Class').findOne({ name: grade, section: section || 'A', session: session });
      if (cls) query.classId = cls._id;
    }

    const records = await Attendance.find(query)
      .populate('studentId', 'name rollNumber')
      .populate('classId', 'name section')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance summary report by class/day/session
// @route   GET /api/attendance/report
// @access  Private
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { session, classId, date } = req.query;
    if (!session || !classId || !date) {
      return next(new ErrorResponse('session, classId and date are required', 400));
    }
    const day = new Date(date); day.setHours(0,0,0,0);
    const nextDay = new Date(day.getTime() + 24*60*60*1000);

    const records = await Attendance.find({ session, classId, date: { $gte: day, $lt: nextDay } });
    const total = records.length;
    const present = records.filter(r=>r.status==='present').length;
    const absent = records.filter(r=>r.status==='absent').length;
    const late = records.filter(r=>r.status==='late').length;
    const halfDay = records.filter(r=>r.status==='half-day').length;

    res.status(200).json({ success: true, data: { total, present, absent, late, halfDay, percentage: total>0 ? Math.round((present/total)*100) : 0 } });
  } catch (err) {
    next(err);
  }
};
// @desc    Get student attendance report
// @route   GET /api/attendance/student/:studentId
// @access  Private
exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { studentId: studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('classId', 'name section')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        attendance,
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private (Teacher, Admin)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(id).populate('studentId');
    if (!attendance) {
      return next(new ErrorResponse('Attendance record not found', 404));
    }

    // Check if user can edit this attendance
    if (!canEditAttendance(attendance.date, req.user.role)) {
      return next(new ErrorResponse('You are not authorized to edit this attendance record', 403));
    }

    // Update attendance
    attendance.status = status || attendance.status;
    attendance.remarks = remarks || attendance.remarks;
    attendance.isVerified = true;
    attendance.verifiedBy = req.user.id;
    attendance.verifiedAt = Date.now();

    await attendance.save();

    // Notifications disabled (WhatsApp removed)

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Attendance updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk mark attendance
// @route   POST /api/attendance/bulk
// @access  Private (Teacher only)
exports.bulkMarkAttendance = async (req, res, next) => {
  try {
    const attendanceData = req.body; // Array of attendance records

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return next(new ErrorResponse('Attendance data must be a non-empty array', 400));
    }

    const attendanceRecords = [];
    const errors = [];
    const notifications = []; // WhatsApp removed

    for (const record of attendanceData) {
      const { studentId, status, date, remarks, session: sessionFromBody } = record;

      // Validate date based on user role
      const dateValidation = validateAttendanceDate(date || new Date(), req.user.role);
      if (!dateValidation.isValid) {
        errors.push({ studentId, error: dateValidation.message });
        continue;
      }

      try {
        // Find student
        const student = await Student.findById(studentId);
        if (!student) {
          errors.push({ studentId, error: 'Student not found' });
          continue;
        }

        // Resolve session to use
        let sessionToUse = sessionFromBody;
        if (!sessionToUse) {
          sessionToUse = student.currentSession || null;
          if (!sessionToUse) {
            const currentSessionDoc = await mongoose.model('Session').findOne({ isCurrent: true });
            sessionToUse = currentSessionDoc?.name || null;
          }
        }

        if (!sessionToUse) {
          throw new Error('No active session found to record attendance');
        }
        
        // Find class based on student's grade and section for the specific session
        let classData = await Class.findOne({
          name: student.grade,
          section: student.section,
          session: sessionToUse
        });

        if (!classData) {
          // Auto-create class for this session if missing
          const sessionDoc = await mongoose.model('Session').findOne({ name: sessionToUse });
          classData = await Class.create({
            name: student.grade,
            section: student.section,
            academicYear: sessionDoc?.academicYear || sessionToUse,
            session: sessionToUse,
            capacity: 30,
            isActiveSession: true
          });
        }

        // Check if attendance already marked for the specified date and session
        const attendanceDate = new Date(date || new Date());
        attendanceDate.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
          studentId: studentId,
          session: sessionToUse,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingAttendance) {
          // Update existing attendance
          existingAttendance.status = status;
          existingAttendance.remarks = remarks;
          existingAttendance.markedBy = req.user.id;
          await existingAttendance.save();
          attendanceRecords.push(existingAttendance);
        } else {
          // Create new attendance record
          const attendance = await Attendance.create({
            studentId: studentId,
            classId: classData._id,
            session: sessionToUse,
            date: attendanceDate,
            status,
            markedBy: req.user.id,
            remarks
          });
          attendanceRecords.push(attendance);
        }

        // Add to notifications if absent
        if (status === 'absent' && student.parentPhone) {
          notifications.push({
            phone: student.parentPhone,
            message: `Dear Parent, ${student.name} was absent on ${attendanceDate.toLocaleDateString()}. Please ensure regular attendance.`
          });
        }
      } catch (error) {
        errors.push({ studentId, error: error.message });
      }
    }

    // Send notifications (disabled for now)
    // if (notifications.length > 0) {
    //   // WhatsApp notification logic here
    // }

    res.status(200).json({
      success: true,
      data: attendanceRecords,
      message: `Successfully marked attendance for ${attendanceRecords.length} students`,
      errors: errors.length > 0 ? errors : undefined,
      notificationsCount: notifications.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get class attendance statistics
// @route   GET /api/attendance/class/:classId/statistics
// @access  Private
exports.getClassAttendanceStatistics = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      class: classId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('student', 'name rollNumber');

    const totalStudents = await Student.countDocuments({ class: classId });
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.status === 'late').length;
    const halfDayCount = attendance.filter(a => a.status === 'half-day').length;
    const attendancePercentage = totalStudents > 0 ? ((presentCount + lateCount + halfDayCount) / totalStudents) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        halfDayCount,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance dashboard
// @route   GET /api/attendance/dashboard
// @access  Private
exports.getAttendanceDashboard = async (req, res, next) => {
  try {
    const { date, classId } = req.query;
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    let query = {
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    };

    if (classId) {
      query.class = classId;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber')
      .populate('class', 'name section')
      .populate('markedBy', 'name');

    const totalStudents = classId 
      ? await Student.countDocuments({ class: classId })
      : await Student.countDocuments();

    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.status === 'late').length;
    const halfDayCount = attendance.filter(a => a.status === 'half-day').length;
    const attendancePercentage = totalStudents > 0 ? ((presentCount + lateCount + halfDayCount) / totalStudents) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        date: today,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        halfDayCount,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        attendance
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send attendance notifications
// @route   POST /api/attendance/notifications
// @access  Private (Teacher, Admin)
exports.sendAttendanceNotifications = async (req, res, next) => {
  try {
    const { date, classId, type } = req.body;

    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);

    let query = {
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    };

    if (classId) {
      query.class = classId;
    }

    if (type && type !== 'all') {
      query.status = type;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name parentPhone')
      .populate('class', 'name section');

    const notifications = [];
    let sentCount = 0;

    for (const record of attendance) {
      if (record.student.parentPhone) {
        const message = `Dear Parent, ${record.student.name} was ${record.status} on ${attendanceDate.toLocaleDateString()}. Please ensure regular attendance.`;
        notifications.push({
          phone: record.student.parentPhone,
          message
        });
        sentCount++;
      }
    }

    // Send notifications (disabled for now)
    // if (notifications.length > 0) {
    //   // WhatsApp notification logic here
    // }

    res.status(200).json({
      success: true,
      message: `Notifications prepared for ${sentCount} parents`,
      sentCount,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance statistics by session
// @route   GET /api/attendance/session/:session/stats
// @access  Private
exports.getAttendanceStatsBySession = async (req, res, next) => {
  try {
    const { session } = req.params;
    const { classId, startDate, endDate } = req.query;

    const query = { session };

    if (classId) {
      query.classId = classId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name rollNumber')
      .populate('classId', 'name section');

    // Calculate comprehensive statistics
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.status === 'late').length;
    const halfDayCount = attendance.filter(a => a.status === 'half-day').length;
    
    const attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Group by class
    const classStats = {};
    attendance.forEach(record => {
      const className = `${record.classId.name}-${record.classId.section}`;
      if (!classStats[className]) {
        classStats[className] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0
        };
      }
      classStats[className].total++;
      classStats[className][record.status]++;
    });

    // Calculate class-wise percentages
    Object.keys(classStats).forEach(className => {
      const stats = classStats[className];
      stats.percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        session,
        overallStats: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          halfDayCount,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        },
        classStats,
        dateRange: {
          startDate: startDate || 'Not specified',
          endDate: endDate || 'Not specified'
        }
      }
    });
  } catch (err) {
    next(err);
  }
};