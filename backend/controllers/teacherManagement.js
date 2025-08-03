const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Class = require('../models/Class');
const LoginLog = require('../models/LoginLog');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate a secure random password
const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Get all teachers with detailed information
exports.getAllTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', designation = '', status = '' } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (designation) {
      query.designation = designation;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (page - 1) * limit;
    
    const teachers = await Teacher.find(query)
      .populate('user', 'name email role isActive lastLogin')
      .populate('assignedClasses.class', 'name grade section')
      .populate('classTeacherOf', 'name grade section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Teacher.countDocuments(query);

    res.status(200).json({
      success: true,
      count: teachers.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: teachers.map(teacher => ({
        _id: teacher._id,
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        designation: teacher.designation,
        subjects: teacher.subjects,
        assignedClasses: teacher.assignedClasses,
        qualification: teacher.qualification,
        experience: teacher.experience,
        specialization: teacher.specialization,
        joiningDate: teacher.joiningDate,
        salary: teacher.salary,
        isActive: teacher.isActive,
        onlineStatus: teacher.onlineStatus,
        passwordResetRequired: teacher.passwordResetRequired,
        lastPasswordChange: teacher.lastPasswordChange,
        user: teacher.user,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers',
      error: error.message
    });
  }
};

// Create new teacher
exports.createTeacher = async (req, res) => {
  try {
    console.log('Received teacher creation request:', req.body);
    
    const {
      name,
      email,
      phone,
      designation,
      subjects,
      assignedClasses,
      qualification,
      experience,
      specialization,
      salary,
      emergencyContact,
      joiningDate
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and designation are required'
      });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate secure password
    const password = generatePassword();

    // Create user account for teacher
    const userData = {
      name,
      email,
      password,
      role: 'teacher',
      phone,
      address: 'Not provided', // Set a default address since it's required
      isActive: true
    };

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    
    try {
      const user = await User.create(userData);
      console.log('User created successfully:', user._id);
    } catch (userError) {
      console.error('User creation failed:', userError);
      throw userError;
    }

    // Create teacher profile
    const teacherData = {
      user: user._id,
      name,
      email,
      phone,
      designation,
      subjects: subjects || [],
      assignedClasses: assignedClasses || [],
      qualification: qualification || {},
      experience: experience || { years: 0, previousSchools: [] },
      specialization: specialization || [],
      salary: salary || 0,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      contactInfo: {
        emergencyContact: emergencyContact || {}
      },
      passwordResetRequired: true
    };

    console.log('Creating teacher with data:', JSON.stringify(teacherData, null, 2));
    
    try {
      const teacher = await Teacher.create(teacherData);
      console.log('Teacher created successfully:', teacher._id);
    } catch (createError) {
      console.error('Teacher creation failed:', createError);
      throw createError;
    }

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate('user', 'name email role isActive')
      .populate('assignedClasses.class', 'name grade section');

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        teacher: populatedTeacher,
        temporaryPassword: password,
        message: 'Please provide this temporary password to the teacher. They will be required to change it on first login.'
      }
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating teacher',
      error: error.message
    });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.user;
    delete updateData.teacherId;
    delete updateData.passwordResetRequired;
    delete updateData.lastPasswordChange;

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email role isActive')
     .populate('assignedClasses.class', 'name grade section')
     .populate('classTeacherOf', 'name grade section');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update user information if name or email changed
    if (updateData.name || updateData.email) {
      const userUpdate = {};
      if (updateData.name) userUpdate.name = updateData.name;
      if (updateData.email) userUpdate.email = updateData.email;
      
      await User.findByIdAndUpdate(teacher.user, userUpdate);
    }

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: teacher
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating teacher',
      error: error.message
    });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Deactivate user account
    await User.findByIdAndUpdate(teacher.user, { isActive: false });

    // Deactivate teacher profile
    await Teacher.findByIdAndUpdate(teacherId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Teacher deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting teacher',
      error: error.message
    });
  }
};

// Reset teacher password
exports.resetTeacherPassword = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { forceReset = true } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Generate new password
    const newPassword = generatePassword();

    // Update user password
    const user = await User.findById(teacher.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    user.password = newPassword;
    await user.save();

    // Update teacher password reset flag
    await Teacher.findByIdAndUpdate(teacherId, {
      passwordResetRequired: forceReset,
      lastPasswordChange: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Teacher password reset successfully',
      data: {
        temporaryPassword: newPassword,
        message: forceReset ? 'Teacher will be required to change password on next login.' : 'Password has been reset.'
      }
    });
  } catch (error) {
    console.error('Error resetting teacher password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting teacher password',
      error: error.message
    });
  }
};

// Get teacher login logs
exports.getTeacherLoginLogs = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Build query
    const query = { teacher: teacherId };
    
    if (startDate && endDate) {
      query.loginTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const logs = await LoginLog.find(query)
      .populate('user', 'name email')
      .sort({ loginTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LoginLog.countDocuments(query);

    // Calculate statistics
    const totalSessions = await LoginLog.countDocuments({ teacher: teacherId, status: 'success' });
    const totalDuration = await LoginLog.aggregate([
      { $match: { teacher: teacher._id, status: 'success' } },
      { $group: { _id: null, totalDuration: { $sum: '$sessionDuration' } } }
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      statistics: {
        totalSessions,
        totalDurationMinutes: totalDuration[0]?.totalDuration || 0,
        averageSessionMinutes: totalSessions > 0 ? Math.round((totalDuration[0]?.totalDuration || 0) / totalSessions) : 0
      },
      data: logs
    });
  } catch (error) {
    console.error('Error fetching teacher login logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher login logs',
      error: error.message
    });
  }
};

// Get teacher online status
exports.getTeacherStatus = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId)
      .select('onlineStatus name email teacherId')
      .populate('user', 'lastLogin');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        onlineStatus: teacher.onlineStatus,
        lastLogin: teacher.user?.lastLogin
      }
    });
  } catch (error) {
    console.error('Error fetching teacher status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher status',
      error: error.message
    });
  }
};

// Update teacher online status
exports.updateTeacherStatus = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { isOnline } = req.body;

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        'onlineStatus.isOnline': isOnline,
        'onlineStatus.lastSeen': new Date(),
        'onlineStatus.lastActivity': new Date()
      },
      { new: true }
    ).populate('user', 'lastLogin');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Teacher status updated successfully',
      data: {
        teacherId: teacher.teacherId,
        name: teacher.name,
        email: teacher.email,
        onlineStatus: teacher.onlineStatus,
        lastLogin: teacher.user?.lastLogin
      }
    });
  } catch (error) {
    console.error('Error updating teacher status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating teacher status',
      error: error.message
    });
  }
};

// Get all online teachers
exports.getOnlineTeachers = async (req, res) => {
  try {
    const onlineTeachers = await Teacher.find({
      'onlineStatus.isOnline': true,
      isActive: true
    })
    .select('teacherId name email designation onlineStatus')
    .populate('user', 'lastLogin')
    .sort({ 'onlineStatus.lastActivity': -1 });

    res.status(200).json({
      success: true,
      count: onlineTeachers.length,
      data: onlineTeachers
    });
  } catch (error) {
    console.error('Error fetching online teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online teachers',
      error: error.message
    });
  }
};

// Assign classes to teacher
exports.assignClassesToTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { assignedClasses } = req.body;

    if (!assignedClasses || !Array.isArray(assignedClasses)) {
      return res.status(400).json({
        success: false,
        message: 'Assigned classes array is required'
      });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Validate that all classes exist
    for (const assignment of assignedClasses) {
      if (assignment.class) {
        const classExists = await Class.findById(assignment.class);
        if (!classExists) {
          return res.status(400).json({
            success: false,
            message: `Class with ID ${assignment.class} not found`
          });
        }
      }
    }

    teacher.assignedClasses = assignedClasses;
    await teacher.save();

    const populatedTeacher = await Teacher.findById(teacherId)
      .populate('assignedClasses.class', 'name grade section')
      .populate('user', 'name email role isActive');

    res.status(200).json({
      success: true,
      message: 'Classes assigned to teacher successfully',
      data: populatedTeacher
    });
  } catch (error) {
    console.error('Error assigning classes to teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning classes to teacher',
      error: error.message
    });
  }
};

// Get teacher statistics
exports.getTeacherStatistics = async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ isActive: true });
    const onlineTeachers = await Teacher.countDocuments({ 'onlineStatus.isOnline': true });
    
    const designationStats = await Teacher.aggregate([
      { $group: { _id: '$designation', count: { $sum: 1 } } }
    ]);

    const recentLogins = await LoginLog.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$teacher', lastLogin: { $max: '$loginTime' } } },
      { $sort: { lastLogin: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      { $unwind: '$teacher' },
      { $project: { teacherId: '$teacher.teacherId', name: '$teacher.name', lastLogin: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        onlineTeachers,
        designationStats,
        recentLogins
      }
    });
  } catch (error) {
    console.error('Error fetching teacher statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher statistics',
      error: error.message
    });
  }
};