const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { sendEmail } = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register parent and generate credentials
// @route   POST /api/parents/register
// @access  Public
exports.registerParent = async (req, res) => {
  try {
    const { studentId, parentName, parentEmail, parentPhone, parentAddress } = req.body;

    // Check if parent already exists
    let parent = await Parent.findOne({ email: parentEmail });
    
    if (parent) {
      // If parent exists, add student to their children list
      if (!parent.children.includes(studentId)) {
        parent.children.push(studentId);
        await parent.save();
      }
      
      // Update student with parent reference
      await Student.findByIdAndUpdate(studentId, { 
        parent: parent._id,
        parentEmail: parentEmail 
      });
      
      return res.status(200).json({
        success: true,
        message: 'Student added to existing parent account',
        data: { parentId: parent._id }
      });
    }

    // Generate unique credentials
    const { parentId, password } = Parent.generateCredentials();

    // Create new parent
    parent = new Parent({
      name: parentName,
      email: parentEmail,
      password: password,
      phone: parentPhone,
      address: parentAddress,
      children: [studentId],
      credentialsGenerated: true,
      credentialsGeneratedAt: new Date()
    });

    await parent.save();

    // Update student with parent reference
    await Student.findByIdAndUpdate(studentId, { 
      parent: parent._id,
      parentEmail: parentEmail 
    });

    // Send credentials email
    const emailSubject = 'Parent Portal Access Credentials';
    const emailBody = `
      <h2>Welcome to the School Parent Portal</h2>
      <p>Dear ${parentName},</p>
      <p>Your parent portal account has been created successfully. You can now access your child's academic information and homework assignments.</p>
      
      <h3>Login Credentials:</h3>
      <p><strong>Email:</strong> ${parentEmail}</p>
      <p><strong>Password:</strong> ${password}</p>
      
      <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
      
      <p>You can access the parent portal at: <a href="${process.env.FRONTEND_URL}/parent-login">Parent Portal Login</a></p>
      
      <p>Best regards,<br>School Administration</p>
    `;

    try {
      await sendEmail({
        email: parentEmail,
        subject: emailSubject,
        message: emailBody
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Parent registered successfully. Credentials sent via email.',
      data: { parentId: parent._id }
    });

  } catch (error) {
    console.error('Parent registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering parent',
      error: error.message
    });
  }
};

// @desc    Login parent
// @route   POST /api/parents/login
// @access  Public
exports.loginParent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if parent exists and is active
    const parent = await Parent.findOne({ email, isActive: true })
      .select('+password')
      .populate('children', 'name grade section rollNumber parentName parentPhone parentEmail');

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await parent.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    parent.lastLogin = new Date();
    await parent.save();

    // Generate token
    const token = parent.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        parent: {
          id: parent._id,
          name: parent.name,
          email: parent.email,
          phone: parent.phone,
          children: parent.children
        }
      }
    });

  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in parent',
      error: error.message
    });
  }
};

// @desc    Get parent profile
// @route   GET /api/parents/profile
// @access  Private (Parent)
exports.getParentProfile = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id)
      .populate('children', 'name grade section rollNumber parentName parentPhone parentEmail');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.status(200).json({
      success: true,
      data: parent
    });

  } catch (error) {
    console.error('Get parent profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching parent profile',
      error: error.message
    });
  }
};

// @desc    Update parent profile
// @route   PUT /api/parents/profile
// @access  Private (Parent)
exports.updateParentProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const parent = await Parent.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true, runValidators: true }
    ).populate('children', 'name grade section rollNumber parentName parentPhone parentEmail');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: parent
    });

  } catch (error) {
    console.error('Update parent profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating parent profile',
      error: error.message
    });
  }
};

// @desc    Change parent password
// @route   PUT /api/parents/change-password
// @access  Private (Parent)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const parent = await Parent.findById(req.user.id).select('+password');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Check current password
    const isMatch = await parent.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    parent.password = newPassword;
    await parent.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/parents/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const parent = await Parent.findOne({ email, isActive: true });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found with this email'
      });
    }

    // Get reset token
    const resetToken = parent.getResetPasswordToken();
    await parent.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/parent-reset-password/${resetToken}`;

    const message = `
      <h2>Password Reset Request</h2>
      <p>Dear ${parent.name},</p>
      <p>You have requested to reset your password. Please click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,<br>School Administration</p>
    `;

    try {
      await sendEmail({
        email: parent.email,
        subject: 'Password Reset Request',
        message: message
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      parent.resetPasswordToken = undefined;
      parent.resetPasswordExpire = undefined;
      await parent.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/parents/reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { resettoken } = req.params;
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resettoken)
      .digest('hex');

    const parent = await Parent.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!parent) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    parent.password = password;
    parent.resetPasswordToken = undefined;
    parent.resetPasswordExpire = undefined;
    await parent.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// @desc    Get attendance for a specific student
// @route   GET /api/parents/attendance/:studentId
// @access  Private (Parent only)
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify the student belongs to this parent
    const parent = await Parent.findById(req.user.id);
    if (!parent.children.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This student is not under your care.'
      });
    }

    // Build query
    const query = { student: studentId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get attendance records
    const attendance = await Attendance.find(query)
      .populate('student', 'name rollNumber grade section')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
};

// @desc    Get attendance summary for a student
// @route   GET /api/parents/attendance/:studentId/summary
// @access  Private (Parent only)
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify the student belongs to this parent
    const parent = await Parent.findById(req.user.id);
    if (!parent.children.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This student is not under your care.'
      });
    }

    // Build query
    const query = { student: studentId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get attendance records
    const attendance = await Attendance.find(query);
    
    // Calculate summary
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage
      }
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    });
  }
};

// @desc    Get monthly attendance for a student
// @route   GET /api/parents/attendance/:studentId/monthly
// @access  Private (Parent only)
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    // Verify the student belongs to this parent
    const parent = await Parent.findById(req.user.id);
    if (!parent.children.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This student is not under your care.'
      });
    }

    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get attendance records for the month
    const attendance = await Attendance.find({
      student: studentId,
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('student', 'name rollNumber grade section')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate summary
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const lateDays = attendance.filter(a => a.status === 'late').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        month: startDate.toLocaleString('default', { month: 'long' }),
        year: parseInt(year),
        attendance,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendancePercentage
        }
      }
    });
  } catch (error) {
    console.error('Get monthly attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly attendance',
      error: error.message
    });
  }
};

// @desc    Get current month attendance for all children
// @route   GET /api/parents/attendance/current-month
// @access  Private (Parent only)
exports.getCurrentMonthAttendance = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id).populate('children', 'name rollNumber grade section');
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Get current month date range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const childrenAttendance = [];

    for (const child of parent.children) {
      // Get attendance for this child
      const attendance = await Attendance.find({
        student: child._id,
        date: { $gte: startDate, $lte: endDate }
      })
        .populate('student', 'name rollNumber grade section')
        .populate('markedBy', 'name')
        .sort({ date: -1 });

      // Calculate summary
      const totalDays = attendance.length;
      const presentDays = attendance.filter(a => a.status === 'present').length;
      const absentDays = attendance.filter(a => a.status === 'absent').length;
      const lateDays = attendance.filter(a => a.status === 'late').length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      childrenAttendance.push({
        student: child,
        attendance,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendancePercentage
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        children: childrenAttendance
      }
    });
  } catch (error) {
    console.error('Get current month attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current month attendance',
      error: error.message
    });
  }
};