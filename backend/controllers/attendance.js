const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const ErrorResponse = require('../utils/errorResponse');
const { validateAttendanceDate, canEditAttendance } = require('../utils/dateValidation');
const whatsappService = require('../services/whatsappService');

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
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Check if attendance already marked for the specified date
    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      student: studentId,
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
      student: studentId,
      class: student.class._id,
      date: attendanceDate,
      status,
      markedBy: req.user.id,
      remarks
    });

    // Send WhatsApp notification to parent
    try {
      const formattedDate = attendanceDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      await whatsappService.sendAttendanceNotification(
        student.parentPhone,
        student.name,
        status,
        formattedDate
      );
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
      // Don't fail the attendance marking if WhatsApp fails
    }

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
      query.class = classId;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name studentId parentPhone')
      .populate('class', 'name section')
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

    const query = { student: studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name section')
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

    const attendance = await Attendance.findById(id).populate('student');
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

    // Send WhatsApp notification if status changed
    if (status && status !== attendance.status && attendance.student) {
      try {
        const formattedDate = attendance.date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        await whatsappService.sendAttendanceNotification(
          attendance.student.parentPhone,
          attendance.student.name,
          status,
          formattedDate
        );
      } catch (whatsappError) {
        console.error('WhatsApp notification failed:', whatsappError);
      }
    }

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
    const { classId, date, attendanceData } = req.body;

    // Validate date based on user role
    const dateValidation = validateAttendanceDate(date || new Date(), req.user.role);
    if (!dateValidation.isValid) {
      return next(new ErrorResponse(dateValidation.message, 400));
    }

    const attendanceRecords = [];
    const errors = [];
    const notifications = [];

    for (const record of attendanceData) {
      try {
        const { studentId, status, remarks } = record;

        // Check if attendance already exists
        const attendanceDate = new Date(date || new Date());
        attendanceDate.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
          student: studentId,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingAttendance) {
          errors.push(`Attendance already marked for student ${studentId}`);
          continue;
        }

        const student = await Student.findById(studentId);
        if (!student) {
          errors.push(`Student ${studentId} not found`);
          continue;
        }

        const attendance = await Attendance.create({
          student: studentId,
          class: classId,
          date: attendanceDate,
          status,
          markedBy: req.user.id,
          remarks
        });

        attendanceRecords.push(attendance);

        // Send WhatsApp notification
        try {
          const formattedDate = attendanceDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          const notificationSent = await whatsappService.sendAttendanceNotification(
            student.parentPhone,
            student.name,
            status,
            formattedDate
          );
          
          if (notificationSent) {
            notifications.push(`Notification sent to ${student.name}'s parent`);
          }
        } catch (whatsappError) {
          console.error('WhatsApp notification failed for student:', student.name, whatsappError);
        }
      } catch (error) {
        errors.push(`Error marking attendance for student ${record.studentId}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        marked: attendanceRecords.length,
        errors,
        notifications,
        records: attendanceRecords
      }
    });
  } catch (err) {
    next(err);
  }
};