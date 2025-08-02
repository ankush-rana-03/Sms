const Student = require('../models/Student');
const User = require('../models/User');

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

    const students = await Student.find(query).select('-facialData.faceDescriptor');
    
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
        facialData: {
          hasFaceData: !!student.facialData,
          isFaceRegistered: student.facialData?.isFaceRegistered || false,
          faceId: student.facialData?.faceId,
          hasFaceImage: !!student.facialData?.faceImage
        },
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
    const { studentId, status, date, verifiedWithFace = false } = req.body;
    
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
      existingAttendance.verifiedWithFace = verifiedWithFace;
    } else {
      // Add new attendance record
      student.attendance.push({
        date,
        status,
        markedAt: new Date(),
        markedBy: req.user.id,
        verifiedWithFace
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
        verifiedWithFace,
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

    const students = await Student.find(query).select('-facialData.faceDescriptor');
    
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
        markedAt: todayRecord ? todayRecord.markedAt : null,
        verifiedWithFace: todayRecord ? todayRecord.verifiedWithFace : false
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