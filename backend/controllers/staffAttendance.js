const StaffAttendance = require('../models/StaffAttendance');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Staff check-in
// @route   POST /api/staff-attendance/check-in
// @access  Private (All staff)
exports.staffCheckIn = async (req, res, next) => {
  try {
    const { location, method = 'manual' } = req.body;
    const staffId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await StaffAttendance.findOne({
      staffId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return next(new ErrorResponse('Already checked in today', 400));
    }

    // Create or update attendance record
    let attendance;
    if (existingAttendance) {
      existingAttendance.checkIn = {
        time: new Date(),
        location,
        method
      };
      existingAttendance.status = 'present';
      attendance = await existingAttendance.save();
    } else {
      attendance = await StaffAttendance.create({
        staffId,
        date: today,
        checkIn: {
          time: new Date(),
          location,
          method
        },
        status: 'present',
        markedBy: staffId
      });
    }

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Check-in successful'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Staff check-out
// @route   POST /api/staff-attendance/check-out
// @access  Private (All staff)
exports.staffCheckOut = async (req, res, next) => {
  try {
    const { location, method = 'manual' } = req.body;
    const staffId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await StaffAttendance.findOne({
      staffId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return next(new ErrorResponse('No check-in record found for today', 400));
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      return next(new ErrorResponse('Already checked out today', 400));
    }

    // Update check-out
    attendance.checkOut = {
      time: new Date(),
      location,
      method
    };

    // Calculate working hours
    attendance.calculateWorkingHours();

    // Check for overtime (assuming 8 hours = 480 minutes is standard)
    const standardHours = 480; // 8 hours in minutes
    if (attendance.workingHours > standardHours) {
      attendance.overtime = attendance.workingHours - standardHours;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Check-out successful'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark staff attendance manually (Admin/Principal)
// @route   POST /api/staff-attendance/mark
// @access  Private (Admin, Principal)
exports.markStaffAttendance = async (req, res, next) => {
  try {
    const { staffId, status, date, checkInTime, checkOutTime, leaveType, leaveReason, remarks } = req.body;

    if (!['admin', 'principal'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized to mark staff attendance', 403));
    }

    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await StaffAttendance.findOne({
      staffId,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return next(new ErrorResponse('Attendance already marked for this date', 400));
    }

    // Create attendance record
    const attendanceData = {
      staffId,
      date: attendanceDate,
      status,
      markedBy: req.user.id,
      remarks
    };

    if (checkInTime) {
      attendanceData.checkIn = {
        time: new Date(checkInTime),
        method: 'manual'
      };
    }

    if (checkOutTime) {
      attendanceData.checkOut = {
        time: new Date(checkOutTime),
        method: 'manual'
      };
    }

    if (leaveType) {
      attendanceData.leaveType = leaveType;
      attendanceData.leaveReason = leaveReason;
    }

    const attendance = await StaffAttendance.create(attendanceData);

    // Calculate working hours if both check-in and check-out are provided
    if (checkInTime && checkOutTime) {
      attendance.calculateWorkingHours();
      await attendance.save();
    }

    res.status(201).json({
      success: true,
      data: attendance,
      message: 'Staff attendance marked successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get staff attendance by date
// @route   GET /api/staff-attendance/date/:date
// @access  Private (Admin, Principal)
exports.getStaffAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { department } = req.query;

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const query = {
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    };

    const attendance = await StaffAttendance.find(query)
      .populate('staffId', 'name email role department')
      .populate('markedBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ 'checkIn.time': 1 });

    // Filter by department if specified
    let filteredAttendance = attendance;
    if (department) {
      filteredAttendance = attendance.filter(record => 
        record.staffId.department === department
      );
    }

    res.status(200).json({
      success: true,
      count: filteredAttendance.length,
      data: filteredAttendance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get staff attendance report
// @route   GET /api/staff-attendance/staff/:staffId
// @access  Private (Admin, Principal, or own attendance)
exports.getStaffAttendanceReport = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate, month, year } = req.query;

    // Check if user can access this staff's attendance
    if (req.user.role !== 'admin' && req.user.role !== 'principal' && req.user.id !== staffId) {
      return next(new ErrorResponse('Not authorized to view this attendance', 403));
    }

    let query = { staffId };

    // Date filtering
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    }

    const attendance = await StaffAttendance.find(query)
      .populate('staffId', 'name email role department')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(record => record.status === 'present').length;
    const absentDays = attendance.filter(record => record.status === 'absent').length;
    const lateDays = attendance.filter(record => record.status === 'late').length;
    const leaveDays = attendance.filter(record => record.status === 'leave').length;
    const totalWorkingHours = attendance.reduce((sum, record) => sum + (record.workingHours || 0), 0);
    const totalOvertime = attendance.reduce((sum, record) => sum + (record.overtime || 0), 0);

    const statistics = {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      attendancePercentage: totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0,
      totalWorkingHours: Math.round(totalWorkingHours / 60 * 100) / 100, // Convert to hours
      totalOvertime: Math.round(totalOvertime / 60 * 100) / 100 // Convert to hours
    };

    res.status(200).json({
      success: true,
      data: attendance,
      statistics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update staff attendance
// @route   PUT /api/staff-attendance/:id
// @access  Private (Admin, Principal)
exports.updateStaffAttendance = async (req, res, next) => {
  try {
    const { status, checkInTime, checkOutTime, leaveType, leaveReason, remarks } = req.body;
    const { id } = req.params;

    if (!['admin', 'principal'].includes(req.user.role)) {
      return next(new ErrorResponse('Not authorized to update staff attendance', 403));
    }

    const attendance = await StaffAttendance.findById(id);
    if (!attendance) {
      return next(new ErrorResponse('Attendance record not found', 404));
    }

    // Update fields
    if (status) attendance.status = status;
    if (checkInTime) {
      attendance.checkIn = {
        ...attendance.checkIn,
        time: new Date(checkInTime)
      };
    }
    if (checkOutTime) {
      attendance.checkOut = {
        ...attendance.checkOut,
        time: new Date(checkOutTime)
      };
    }
    if (leaveType) attendance.leaveType = leaveType;
    if (leaveReason) attendance.leaveReason = leaveReason;
    if (remarks) attendance.remarks = remarks;

    // Recalculate working hours
    attendance.calculateWorkingHours();

    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Attendance updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get staff attendance dashboard
// @route   GET /api/staff-attendance/dashboard
// @access  Private (Admin, Principal)
exports.getStaffAttendanceDashboard = async (req, res, next) => {
  try {
    const { date } = req.query;
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance
    const todayAttendance = await StaffAttendance.find({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('staffId', 'name email role department');

    // Get total staff count
    const totalStaff = await User.countDocuments({ role: { $in: ['teacher', 'admin', 'principal'] } });

    // Calculate statistics
    const presentCount = todayAttendance.filter(record => record.status === 'present').length;
    const absentCount = todayAttendance.filter(record => record.status === 'absent').length;
    const lateCount = todayAttendance.filter(record => record.status === 'late').length;
    const leaveCount = todayAttendance.filter(record => record.status === 'leave').length;
    const notMarkedCount = totalStaff - todayAttendance.length;

    const dashboard = {
      date: today,
      totalStaff,
      presentCount,
      absentCount,
      lateCount,
      leaveCount,
      notMarkedCount,
      attendancePercentage: totalStaff > 0 ? ((presentCount + lateCount) / totalStaff) * 100 : 0,
      attendance: todayAttendance
    };

    res.status(200).json({
      success: true,
      data: dashboard
    });
  } catch (err) {
    next(err);
  }
};