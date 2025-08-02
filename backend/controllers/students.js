const Student = require('../models/Student');
const User = require('../models/User');
const faceRecognitionService = require('../services/faceRecognitionService');

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
        hasFaceData: !!student.facialData,
        isFaceRegistered: student.facialData?.isFaceRegistered,
        faceDescriptorLength: student.facialData?.faceDescriptor?.length || 0,
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
        facialData: {
          hasFaceData: !!student.facialData,
          isFaceRegistered: student.facialData?.isFaceRegistered || false,
          faceId: student.facialData?.faceId,
          faceDescriptorLength: student.facialData?.faceDescriptor?.length || 0,
          hasFaceImage: !!student.facialData?.faceImage
        },
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

// Create a new student with facial data
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
      section,
      rollNumber,
      gender,
      bloodGroup,
      parentName,
      parentPhone,
      facialData: {
        faceId: facialData.faceId,
        faceDescriptor: facialData.faceDescriptor,
        faceImage: facialData.faceImage,
        isFaceRegistered: true
      }
    });

    console.log('Student created successfully:', student._id);
    
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
  console.log('=== GET STUDENTS REQUEST ===');
  console.log('User:', req.user);
  
  try {
    const students = await Student.find().select('-facialData.faceDescriptor');
    
    console.log('Found students:', students.length);
    
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

    console.log('=== FACE ATTENDANCE MARKING REQUEST ===');
    console.log('Student ID:', studentId);
    console.log('Attendance Date:', attendanceDate);
    console.log('Status:', status);
    console.log('Captured Face Descriptor Type:', typeof capturedFaceDescriptor);
    console.log('Captured Face Descriptor Length:', capturedFaceDescriptor?.length);
    console.log('Captured Face Descriptor Sample:', capturedFaceDescriptor?.slice(0, 5));

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('Student found:', student.name);
    console.log('Student facial data exists:', !!student.facialData);
    console.log('Face is registered:', student.facialData?.isFaceRegistered);
    console.log('Stored face descriptor length:', student.facialData?.faceDescriptor?.length);

    // Check if student has registered face
    if (!student.facialData?.isFaceRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Student does not have registered facial data'
      });
    }

    // Compare faces using face recognition service
    const storedFaceDescriptor = student.facialData.faceDescriptor;
    
    console.log('=== FACE DESCRIPTOR VALIDATION ===');
    console.log('Stored face descriptor type:', typeof storedFaceDescriptor);
    console.log('Stored face descriptor length:', storedFaceDescriptor?.length);
    console.log('Stored face descriptor sample:', storedFaceDescriptor?.slice(0, 5));
    console.log('Captured face descriptor type:', typeof capturedFaceDescriptor);
    console.log('Captured face descriptor length:', capturedFaceDescriptor?.length);
    console.log('Captured face descriptor sample:', capturedFaceDescriptor?.slice(0, 5));
    
    // Comprehensive validation for stored face descriptor
    if (!storedFaceDescriptor) {
      console.error('ERROR: Stored face descriptor is null/undefined');
      return res.status(400).json({
        success: false,
        message: 'Student does not have registered facial data. Please re-register the student\'s face.'
      });
    }
    
    if (!Array.isArray(storedFaceDescriptor)) {
      console.error('ERROR: Stored face descriptor is not an array');
      return res.status(400).json({
        success: false,
        message: 'Invalid stored facial data format. Please re-register the student\'s face.'
      });
    }
    
    if (storedFaceDescriptor.length === 0) {
      console.error('ERROR: Stored face descriptor is empty');
      return res.status(400).json({
        success: false,
        message: 'Student\'s registered facial data is empty. Please re-register the student\'s face.'
      });
    }
    
    // Validate that stored descriptor contains only numbers
    for (let i = 0; i < storedFaceDescriptor.length; i++) {
      if (typeof storedFaceDescriptor[i] !== 'number') {
        console.error(`ERROR: Stored face descriptor contains non-number at index ${i}:`, storedFaceDescriptor[i]);
        return res.status(400).json({
          success: false,
          message: 'Invalid stored facial data format. Please re-register the student\'s face.'
        });
      }
    }
    
    // Comprehensive validation for captured face descriptor
    if (!capturedFaceDescriptor) {
      console.error('ERROR: Captured face descriptor is null/undefined');
      return res.status(400).json({
        success: false,
        message: 'No face detected in the captured image. Please try again.'
      });
    }
    
    if (!Array.isArray(capturedFaceDescriptor)) {
      console.error('ERROR: Captured face descriptor is not an array');
      return res.status(400).json({
        success: false,
        message: 'Invalid captured facial data format. Please try again.'
      });
    }
    
    if (capturedFaceDescriptor.length === 0) {
      console.error('ERROR: Captured face descriptor is empty');
      return res.status(400).json({
        success: false,
        message: 'No face detected in the captured image. Please try again.'
      });
    }
    
    // Validate that captured descriptor contains only numbers
    for (let i = 0; i < capturedFaceDescriptor.length; i++) {
      if (typeof capturedFaceDescriptor[i] !== 'number') {
        console.error(`ERROR: Captured face descriptor contains non-number at index ${i}:`, capturedFaceDescriptor[i]);
        return res.status(400).json({
          success: false,
          message: 'Invalid captured facial data format. Please try again.'
        });
      }
    }
    
    // Check if descriptors have the same length
    if (storedFaceDescriptor.length !== capturedFaceDescriptor.length) {
      console.error('ERROR: Face descriptor length mismatch');
      console.error('Stored length:', storedFaceDescriptor.length);
      console.error('Captured length:', capturedFaceDescriptor.length);
      return res.status(400).json({
        success: false,
        message: `Face recognition error: Descriptor length mismatch (${storedFaceDescriptor.length} vs ${capturedFaceDescriptor.length}). Please try again or re-register the student's face.`
      });
    }
    
    console.log('=== FACE DESCRIPTORS VALIDATED SUCCESSFULLY ===');
    console.log('Both descriptors are arrays with length:', storedFaceDescriptor.length);
    console.log('All elements are numbers. Proceeding with comparison...');
    
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
    
    // Provide more specific error messages
    let errorMessage = 'Error marking attendance';
    if (error.message.includes('Face descriptors must have the same length')) {
      errorMessage = 'Face recognition error: Descriptor length mismatch. Please try again or re-register the student\'s face.';
    } else if (error.message.includes('No face detected')) {
      errorMessage = 'No face detected in the image. Please ensure the student\'s face is clearly visible and try again.';
    } else if (error.message.includes('Invalid')) {
      errorMessage = 'Invalid facial data. Please try again or re-register the student\'s face.';
    } else {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// Debug face descriptor utility
exports.debugFaceDescriptor = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const facialData = student.facialData;
    const faceDescriptor = facialData?.faceDescriptor;
    
    const debugInfo = {
      studentId: student._id,
      studentName: student.name,
      hasFacialData: !!facialData,
      isFaceRegistered: facialData?.isFaceRegistered,
      faceDescriptorType: typeof faceDescriptor,
      faceDescriptorLength: faceDescriptor?.length,
      faceDescriptorSample: faceDescriptor?.slice(0, 5),
      faceDescriptorValid: Array.isArray(faceDescriptor) && faceDescriptor.length > 0,
      allElementsNumbers: faceDescriptor ? faceDescriptor.every(val => typeof val === 'number') : false
    };
    
    res.status(200).json({
      success: true,
      data: debugInfo
    });
  } catch (error) {
    console.error('Error debugging face descriptor:', error);
    res.status(500).json({
      success: false,
      message: 'Error debugging face descriptor',
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