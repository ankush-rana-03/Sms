const Student = require('../models/Student');
const User = require('../models/User');

// Test route to get all students with full details (for debugging)
exports.getAllStudentsTest = async (req, res) => {
  try {
    console.log('=== TEST ROUTE: Getting all students ===');
    
    const students = await Student.find({});
    
    console.log('Total students in database:', students.length);
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, {
        id: student._id,
        name: student.name,
        email: student.email,
        createdAt: student.createdAt
      });
    });
    
    res.status(200).json({
      success: true,
      message: 'Test route - All students retrieved',
      count: students.length,
      data: students.map(student => ({
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        dateOfBirth: student.dateOfBirth,
        grade: student.grade,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving students for testing',
      error: error.message
    });
  }
};

// Create a new student
exports.createStudent = async (req, res) => {
  console.log('=== CREATE STUDENT REQUEST ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  try {
    const {
      name,
      email,
      phone,
      address,
      dateOfBirth,
      grade,
      section,
      rollNumber,
      gender,
      bloodGroup,
      parentName,
      parentPhone
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Enforce unique roll number within grade + section
    const existingRoll = await Student.findOne({ grade, section, rollNumber });
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: `Roll number ${rollNumber} already exists for Grade ${grade}-${section}`
      });
    }

    // Create student
    const student = await Student.create({
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      address: address?.trim(),
      dateOfBirth,
      grade,
      section,
      rollNumber: rollNumber?.trim(),
      gender,
      bloodGroup,
      parentName: parentName?.trim(),
      parentPhone: parentPhone?.trim()
    });

    console.log('Student created successfully:', student._id);
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });

  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
};

// Get all students with search/pagination
exports.getStudents = async (req, res) => {
  console.log('=== GET STUDENTS REQUEST ===');
  console.log('User:', req.user);
  
  try {
    const { page = 1, limit = 20, search = '', grade = '', section = '' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (grade) query.grade = grade;
    if (section) query.section = section;

    const skip = (Number(page) - 1) * Number(limit);
    const [students, total] = await Promise.all([
      Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Student.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const update = { ...req.body };

    // Prevent email collision
    if (update.email) {
      const exists = await Student.findOne({ email: update.email, _id: { $ne: studentId } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email already in use by another student' });
      }
    }

    // Enforce unique roll number within grade + section
    if (update.rollNumber || update.grade || update.section) {
      const current = await Student.findById(studentId);
      const grade = update.grade || current.grade;
      const section = update.section || current.section;
      const rollNumber = update.rollNumber || current.rollNumber;
      const dup = await Student.findOne({ _id: { $ne: studentId }, grade, section, rollNumber });
      if (dup) {
        return res.status(400).json({ success: false, message: `Roll number ${rollNumber} already exists for Grade ${grade}-${section}` });
      }
    }

    const student = await Student.findByIdAndUpdate(studentId, update, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.status(200).json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Error updating student', error: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByIdAndDelete(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
  }
};

// Get attendance records for a student
exports.getStudentAttendance = async (req, res) => {
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

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email
        },
        attendance
      }
    });

  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
};