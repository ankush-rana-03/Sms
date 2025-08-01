const Student = require('../models/Student');
const User = require('../models/User');
const faceRecognitionService = require('../services/faceRecognitionService');

// Create a new student with facial data
exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      dateOfBirth,
      grade,
      parentName,
      parentPhone,
      facialData
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Create student with facial data
    const student = await Student.create({
      name,
      email,
      phone,
      address,
      dateOfBirth,
      grade,
      parentName,
      parentPhone,
      facialData: {
        faceId: facialData.faceId,
        faceDescriptor: facialData.faceDescriptor,
        faceImage: facialData.faceImage,
        isFaceRegistered: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully with facial data',
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

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-facialData.faceDescriptor');
    
    res.status(200).json({
      success: true,
      count: students.length,
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

// Mark attendance with face verification
exports.markAttendanceWithFace = async (req, res) => {
  try {
    const { studentId, capturedFaceDescriptor, attendanceDate, status } = req.body;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if student has registered face
    if (!student.facialData?.isFaceRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Student does not have registered facial data'
      });
    }

    // Compare faces using face recognition service
    const storedFaceDescriptor = student.facialData.faceDescriptor;
    const similarity = await faceRecognitionService.compareFaces(
      storedFaceDescriptor,
      capturedFaceDescriptor
    );

    console.log('Face similarity score:', similarity);

    // Threshold for face matching (0.6 is a good threshold)
    const FACE_MATCH_THRESHOLD = 0.6;
    const isFaceMatch = similarity >= FACE_MATCH_THRESHOLD;

    if (!isFaceMatch) {
      return res.status(400).json({
        success: false,
        message: 'Face verification failed. Please try again.',
        similarity: similarity
      });
    }

    // Create or update attendance record
    const attendanceDateStr = new Date(attendanceDate).toISOString().split('T')[0];
    
    // Check if attendance already exists for this date
    const existingAttendance = await Student.findOne({
      _id: studentId,
      'attendance.date': attendanceDateStr
    });

    if (existingAttendance) {
      // Update existing attendance
      await Student.updateOne(
        { 
          _id: studentId,
          'attendance.date': attendanceDateStr
        },
        {
          $set: {
            'attendance.$.status': status,
            'attendance.$.markedAt': new Date(),
            'attendance.$.markedBy': req.user.id
          }
        }
      );
    } else {
      // Add new attendance record
      await Student.updateOne(
        { _id: studentId },
        {
          $push: {
            attendance: {
              date: attendanceDateStr,
              status: status,
              markedAt: new Date(),
              markedBy: req.user.id,
              verifiedWithFace: true
            }
          }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully with face verification',
      data: {
        studentId,
        attendanceDate: attendanceDateStr,
        status,
        similarity,
        verifiedWithFace: true
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