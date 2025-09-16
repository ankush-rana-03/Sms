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
      .select('studentId classId date status remarks markedBy')
      .populate({ path: 'studentId', select: 'name rollNumber parentPhone', options: { lean: true } })
      .populate({ path: 'classId', select: 'name section', options: { lean: true } })
      .populate({ path: 'markedBy', select: 'name', options: { lean: true } })
      .lean();

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
      .sort({ date: -1 })
      .lean();

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

    const records = await Attendance.find({ session, classId, date: { $gte: day, $lt: nextDay } }).lean();
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
      .sort({ date: -1 })
      .lean();

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
// @access  Private (Admin; only for current session)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(id).populate('studentId');
    if (!attendance) {
      return next(new ErrorResponse('Attendance record not found', 404));
    }

    // Check if user can edit attendance for this date
    const canEdit = canEditAttendance(attendance.date, req.user.role);
    if (!canEdit) {
      return next(new ErrorResponse('You cannot edit attendance for this date', 403));
    }

    // Disallow editing if the record's session is not the current session
    const currentSession = await mongoose.model('Session').findOne({ isCurrent: true });
    if (!currentSession || attendance.session !== currentSession.name) {
      return next(new ErrorResponse('Cannot edit attendance for archived or non-current sessions', 400));
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

    // Fetch class to derive grade/section/session
    const cls = await mongoose.model('Class').findById(classId).lean();
    if (!cls) {
      return next(new ErrorResponse('Class not found', 404));
    }

    // Use aggregation for better performance
    const dayEnd = new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000);
    const [attendanceStats, totalStudents] = await Promise.all([
      Attendance.aggregate([
        {
          $match: {
            classId: classId,
            date: { $gte: attendanceDate, $lt: dayEnd }
          }
        },
        {
          $group: {
            _id: null,
            presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
            halfDayCount: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } }
          }
        }
      ]),
      Student.countDocuments({
        grade: cls.name,
        section: cls.section,
        currentSession: cls.session,
        deletedAt: null
      })
    ]);

    const stats = attendanceStats[0] || { presentCount: 0, absentCount: 0, lateCount: 0, halfDayCount: 0 };
    const attendancePercentage = totalStudents > 0 ? ((stats.presentCount + stats.lateCount + stats.halfDayCount) / totalStudents) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        presentCount: stats.presentCount,
        absentCount: stats.absentCount,
        lateCount: stats.lateCount,
        halfDayCount: stats.halfDayCount,
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
      .populate('markedBy', 'name')
      .lean();

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
      .populate('class', 'name section')
      .lean();

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
      .populate('classId', 'name section')
      .lean();

    // Use aggregation for better performance on large datasets
    const statsAggregation = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          halfDayCount: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } }
        }
      }
    ]);

    const classStatsAggregation = await Attendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $unwind: '$classInfo' },
      {
        $group: {
          _id: { name: '$classInfo.name', section: '$classInfo.section' },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          percentage: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    const stats = statsAggregation[0] || { totalRecords: 0, presentCount: 0, absentCount: 0, lateCount: 0, halfDayCount: 0 };
    const attendancePercentage = stats.totalRecords > 0 ? (stats.presentCount / stats.totalRecords) * 100 : 0;

    // Convert aggregation results to expected format
    const classStats = {};
    classStatsAggregation.forEach(item => {
      const className = `${item._id.name}-${item._id.section}`;
      classStats[className] = {
        total: item.total,
        present: item.present,
        absent: item.absent,
        late: item.late,
        halfDay: item.halfDay,
        percentage: Math.round(item.percentage * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      data: {
        session,
        overallStats: {
          totalRecords: stats.totalRecords,
          presentCount: stats.presentCount,
          absentCount: stats.absentCount,
          lateCount: stats.lateCount,
          halfDayCount: stats.halfDayCount,
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