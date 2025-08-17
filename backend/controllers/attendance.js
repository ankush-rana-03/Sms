const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const ErrorResponse = require('../utils/errorResponse');
const { validateAttendanceDate, canEditAttendance } = require('../utils/dateValidation');


// @desc    Mark attendance manually
// @route   POST /api/attendance/mark
// @access  Private (Teacher only)
exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, status, date, remarks } = req.body;

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

    // Find class based on student's grade and section
    const classData = await Class.findOne({
      name: student.grade,
      section: student.section,
      session: student.currentSession || '2025-2026'
    });

    if (!classData) {
      return next(new ErrorResponse(`Class not found for grade ${student.grade} section ${student.section}`, 404));
    }

    // Check if attendance already marked for the specified date
    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      studentId: studentId,
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
      session: student.currentSession || '2025-2026',
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
    const { classId } = req.query;

    const query = {
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      }
    };

    if (classId) {
      query.classId = classId;
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name rollNumber parentPhone')
      .populate('classId', 'name section')
      .populate('markedBy', 'name');

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
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
      const { studentId, status, date, remarks } = record;

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

        // Find class based on student's grade and section
        const classData = await Class.findOne({
          name: student.grade,
          section: student.section,
          session: student.currentSession || '2025-2026'
        });

        if (!classData) {
          errors.push({ studentId, error: `Class not found for grade ${student.grade} section ${student.section}` });
          continue;
        }

        // Check if attendance already marked for the specified date
        const attendanceDate = new Date(date || new Date());
        attendanceDate.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
          studentId: studentId,
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
            session: student.currentSession || '2025-2026',
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