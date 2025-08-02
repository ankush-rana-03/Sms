const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const ErrorResponse = require('../utils/errorResponse');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Mark attendance manually (no face recognition)
// @route   POST /api/attendance/mark
// @access  Private (Teacher only)
exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, status, remarks, attendanceDate } = req.body;

    // Validate required fields
    if (!studentId || !status) {
      return next(new ErrorResponse('Student ID and status are required', 400));
    }

    // Find student
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Determine the date for attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let targetDate = today;
    if (attendanceDate) {
      targetDate = new Date(attendanceDate);
      targetDate.setHours(0, 0, 0, 0);
    }

    // Check user permissions for date access
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin' || userRole === 'principal';
    
    if (!isAdmin) {
      // Teachers can only mark attendance for today
      if (targetDate.getTime() !== today.getTime()) {
        return next(new ErrorResponse('Teachers can only mark attendance for today', 403));
      }
    } else {
      // Admins cannot mark attendance for future dates
      if (targetDate > today) {
        return next(new ErrorResponse('Cannot mark attendance for future dates', 403));
      }
    }

    // Check if attendance already marked for this date
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.remarks = remarks || existingAttendance.remarks;
      existingAttendance.markedBy = req.user.id;
      existingAttendance.updatedAt = new Date();
      
      await existingAttendance.save();
    } else {
      // Create new attendance record
      const attendance = await Attendance.create({
        student: studentId,
        class: student.class._id,
        date: targetDate,
        status,
        markedBy: req.user.id,
        remarks
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        studentId,
        status,
        date: targetDate.toISOString().split('T')[0]
      }
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
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin' || userRole === 'principal';

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check permissions
    if (!isAdmin && targetDate > today) {
      return next(new ErrorResponse('Cannot access future attendance records', 403));
    }

    const query = {
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    };

    if (classId) {
      query.class = classId;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name studentId')
      .populate('class', 'name section')
      .populate('markedBy', 'name');

    // Add permission flags
    const attendanceWithPermissions = attendance.map(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      
      return {
        ...record.toObject(),
        canEdit: isAdmin ? recordDate <= today : recordDate.getTime() === today.getTime(),
        isFuture: recordDate > today,
        isToday: recordDate.getTime() === today.getTime()
      };
    });

    res.status(200).json({
      success: true,
      count: attendanceWithPermissions.length,
      data: attendanceWithPermissions,
      permissions: {
        canEditToday: isAdmin ? true : true,
        canEditPast: isAdmin,
        canViewFuture: isAdmin
      }
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
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin' || userRole === 'principal';

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

    // Add permission flags
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendanceWithPermissions = attendance.map(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      
      return {
        ...record.toObject(),
        canEdit: isAdmin ? recordDate <= today : recordDate.getTime() === today.getTime(),
        isFuture: recordDate > today,
        isToday: recordDate.getTime() === today.getTime()
      };
    });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceWithPermissions,
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
// @access  Private (Teacher, Admin, Principal)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin' || userRole === 'principal';

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return next(new ErrorResponse('Attendance record not found', 404));
    }

    // Check permissions
    const attendanceDate = new Date(attendance.date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!isAdmin) {
      // Teachers can only edit today's attendance
      if (attendanceDate.getTime() !== today.getTime()) {
        return next(new ErrorResponse('Teachers can only edit today\'s attendance', 403));
      }
    } else {
      // Admins cannot edit future attendance
      if (attendanceDate > today) {
        return next(new ErrorResponse('Cannot edit future attendance records', 403));
      }
    }

    // Update attendance
    attendance.status = status || attendance.status;
    attendance.remarks = remarks || attendance.remarks;
    attendance.updatedBy = req.user.id;
    attendance.updatedAt = new Date();

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
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
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin' || userRole === 'principal';

    // Validate date permissions
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!isAdmin) {
      // Teachers can only mark attendance for today
      if (targetDate.getTime() !== today.getTime()) {
        return next(new ErrorResponse('Teachers can only mark attendance for today', 403));
      }
    } else {
      // Admins cannot mark attendance for future dates
      if (targetDate > today) {
        return next(new ErrorResponse('Cannot mark attendance for future dates', 403));
      }
    }

    const attendanceRecords = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const { studentId, status, remarks } = record;

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          student: studentId,
          date: targetDate
        });

        if (existingAttendance) {
          // Update existing attendance
          existingAttendance.status = status;
          existingAttendance.remarks = remarks || existingAttendance.remarks;
          existingAttendance.markedBy = req.user.id;
          existingAttendance.updatedAt = new Date();
          await existingAttendance.save();
          attendanceRecords.push(existingAttendance);
        } else {
          // Create new attendance record
          const student = await Student.findById(studentId);
          if (!student) {
            errors.push(`Student ${studentId} not found`);
            continue;
          }

          const attendance = await Attendance.create({
            student: studentId,
            class: classId,
            date: targetDate,
            status,
            markedBy: req.user.id,
            remarks
          });

          attendanceRecords.push(attendance);
        }
      } catch (error) {
        errors.push(`Error marking attendance for student ${record.studentId}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk attendance marked successfully',
      data: {
        marked: attendanceRecords.length,
        errors,
        records: attendanceRecords
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get today's attendance for a class
// @route   GET /api/attendance/today/:classId
// @access  Private
exports.getTodayAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin' || userRole === 'principal';

    // Get all students in the class
    const students = await Student.find({ class: classId }).populate('class');
    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: 'No students found in this class'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance records
    const todayAttendance = await Attendance.find({
      class: classId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('student', 'name studentId');

    // Create attendance map
    const attendanceMap = new Map();
    todayAttendance.forEach(record => {
      attendanceMap.set(record.student._id.toString(), record);
    });

    // Prepare response with all students
    const attendanceData = students.map(student => {
      const attendanceRecord = attendanceMap.get(student._id.toString());
      return {
        student: {
          id: student._id,
          name: student.name,
          studentId: student.studentId
        },
        attendance: attendanceRecord ? {
          id: attendanceRecord._id,
          status: attendanceRecord.status,
          remarks: attendanceRecord.remarks,
          markedAt: attendanceRecord.markedAt,
          markedBy: attendanceRecord.markedBy
        } : null,
        canEdit: true, // Teachers can always edit today's attendance
        isToday: true
      };
    });

    res.status(200).json({
      success: true,
      count: attendanceData.length,
      data: attendanceData,
      permissions: {
        canEdit: true,
        isToday: true
      }
    });
  } catch (err) {
    next(err);
  }
};