const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const bcrypt = require('bcryptjs');

// Get students by class and section
exports.getStudentsByClass = async (req, res) => {
  console.log('=== GET STUDENTS BY CLASS REQUEST ===');
  console.log('Teacher:', req.user);
  console.log('Query params:', req.query);
  
  try {
    const { grade, section } = req.query;
    
    if (!grade) {
      return res.status(400).json({
        success: false,
        message: 'Grade is required'
      });
    }

    // Build query
    const query = { grade };
    if (section) {
      query.section = section;
    }

    console.log('Database query:', query);

    const students = await Student.find(query);
    
    console.log('Found students:', students.length);
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students.map(student => ({
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        grade: student.grade,
        section: student.section,
        rollNumber: student.rollNumber,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        attendance: student.attendance || []
      }))
    });
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students by class',
      error: error.message
    });
  }
};

// Mark attendance for a student
exports.markAttendance = async (req, res) => {
  console.log('=== MARK ATTENDANCE REQUEST ===');
  console.log('Teacher:', req.user);
  console.log('Request body:', req.body);
  
  try {
    const { studentId, status, date } = req.body;
    
    if (!studentId || !status || !date) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, status, and date are required'
      });
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be present, absent, or late'
      });
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if attendance already marked for this date
    const existingAttendance = student.attendance.find(
      record => record.date === date
    );

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.markedAt = new Date();
      existingAttendance.markedBy = req.user.id;
    } else {
      // Add new attendance record
      student.attendance.push({
        date,
        status,
        markedAt: new Date(),
        markedBy: req.user.id
      });
    }

    await student.save();

    console.log('Attendance marked successfully for student:', studentId);
    
    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        studentId,
        status,
        date,
        markedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
};

// Get attendance for a student
exports.getStudentAttendance = async (req, res) => {
  console.log('=== GET STUDENT ATTENDANCE REQUEST ===');
  console.log('Teacher:', req.user);
  console.log('Student ID:', req.params.studentId);
  
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    let attendance = student.attendance || [];

    // Filter by date range if provided
    if (startDate && endDate) {
      attendance = attendance.filter(record => {
        const recordDate = new Date(record.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return recordDate >= start && recordDate <= end;
      });
    }

    console.log('Found attendance records:', attendance.length);
    
    res.status(200).json({
      success: true,
      count: attendance.length,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          grade: student.grade,
          section: student.section,
          rollNumber: student.rollNumber
        },
        attendance
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student attendance',
      error: error.message
    });
  }
};

// Get today's attendance for a class
exports.getTodayAttendance = async (req, res) => {
  console.log('=== GET TODAY ATTENDANCE REQUEST ===');
  console.log('Teacher:', req.user);
  console.log('Query params:', req.query);
  
  try {
    const { grade, section } = req.query;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!grade) {
      return res.status(400).json({
        success: false,
        message: 'Grade is required'
      });
    }

    // Build query
    const query = { grade };
    if (section) {
      query.section = section;
    }

    const students = await Student.find(query);
    
    const todayAttendance = students.map(student => {
      const todayRecord = student.attendance?.find(record => record.date === today);
      return {
        studentId: student._id,
        name: student.name,
        email: student.email,
        grade: student.grade,
        section: student.section,
        rollNumber: student.rollNumber,
        todayStatus: todayRecord ? todayRecord.status : 'not_marked',
        markedAt: todayRecord ? todayRecord.markedAt : null
      };
    });

    console.log('Today attendance for class:', todayAttendance.length);
    
    res.status(200).json({
      success: true,
      date: today,
      count: todayAttendance.length,
      data: todayAttendance
    });
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today attendance',
      error: error.message
    });
  }
};

// ========== TEACHER MANAGEMENT FUNCTIONS ==========

// Get all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('user', 'name email role isActive')
      .populate('assignedClasses.class', 'name grade section')
      .populate('classTeacherOf', 'name grade section');

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
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
      emergencyContact
    } = req.body;

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Teacher with this email already exists'
      });
    }

    // Create user account for teacher
    const user = await User.create({
      name,
      email,
      password: 'password123', // Default password
      role: 'teacher',
      phone,
      address: '',
      isActive: true
    });

    // Create teacher profile
    const teacher = await Teacher.create({
      user: user._id,
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
      contactInfo: {
        emergencyContact
      }
    });

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate('user', 'name email role isActive')
      .populate('assignedClasses.class', 'name grade section');

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: populatedTeacher
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
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

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email role isActive')
     .populate('assignedClasses.class', 'name grade section');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
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

    // Delete teacher profile
    await Teacher.findByIdAndDelete(teacherId);

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
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
    const { newPassword } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update user password
    const user = await User.findById(teacher.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    user.password = newPassword || 'password123';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Teacher password reset successfully'
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

// Get teacher online status
exports.getTeacherStatus = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findById(teacherId)
      .select('onlineStatus name email');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: teacher.name,
        email: teacher.email,
        onlineStatus: teacher.onlineStatus
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
    );

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
        name: teacher.name,
        email: teacher.email,
        onlineStatus: teacher.onlineStatus
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