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

// @desc    Mark attendance with photo
// @route   POST /api/attendance/mark
// @access  Private (Teacher only)
exports.markAttendance = async (req, res, next) => {
  try {
    const { studentId, status, photo, location, remarks } = req.body;

    // Find student
    const student = await Student.findById(studentId).populate('class');
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return next(new ErrorResponse('Attendance already marked for today', 400));
    }

    let photoUrl = '';
    let publicId = '';

    // Upload photo to Cloudinary if provided
    if (photo) {
      try {
        const result = await cloudinary.uploader.upload(photo, {
          folder: 'attendance',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        photoUrl = result.secure_url;
        publicId = result.public_id;
      } catch (error) {
        console.error('Photo upload error:', error);
        return next(new ErrorResponse('Failed to upload photo', 500));
      }
    }

    // Create attendance record
    const attendance = await Attendance.create({
      student: studentId,
      class: student.class._id,
      date: new Date(),
      status,
      markedBy: req.user.id,
      location,
      photo: {
        url: photoUrl,
        publicId
      },
      remarks
    });

    // Update student attendance stats
    const studentAttendance = student.attendance;
    studentAttendance.totalDays += 1;
    if (status === 'present') {
      studentAttendance.presentDays += 1;
    } else {
      studentAttendance.absentDays += 1;
    }
    await student.save();

    res.status(201).json({
      success: true,
      data: attendance
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
      .populate('student', 'name studentId')
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
// @access  Private (Teacher, Admin, Principal)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return next(new ErrorResponse('Attendance record not found', 404));
    }

    // Update attendance
    attendance.status = status || attendance.status;
    attendance.remarks = remarks || attendance.remarks;
    attendance.isVerified = true;
    attendance.verifiedBy = req.user.id;
    attendance.verifiedAt = Date.now();

    await attendance.save();

    res.status(200).json({
      success: true,
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

    const attendanceRecords = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const { studentId, status, remarks } = record;

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          student: studentId,
          date: new Date(date)
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
          date: new Date(date),
          status,
          markedBy: req.user.id,
          remarks
        });

        attendanceRecords.push(attendance);
      } catch (error) {
        errors.push(`Error marking attendance for student ${record.studentId}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
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