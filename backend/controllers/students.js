const Student = require('../models/Student');
const User = require('../models/User');
const Parent = require('../models/Parent');
const { sendEmail } = require('../utils/sendEmail');
const { createParentAccount } = require('../utils/parentCredentials');

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
      parentPhone,
      parentEmail
    } = req.body;

    // Role-based restriction: if teacher, must be class teacher of this grade/section
    if (req.user?.role === 'teacher') {
      const Teacher = require('../models/Teacher');
      const Class = require('../models/Class');
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher) {
        return res.status(403).json({ success: false, message: 'Teacher profile not found' });
      }
      // If teacher is assigned as classTeacherOf a class, verify that class matches grade-section
      if (!teacher.classTeacherOf) {
        return res.status(403).json({ success: false, message: 'Only class teachers can add students' });
      }
      const cls = await Class.findById(teacher.classTeacherOf);
      if (!cls) {
        return res.status(403).json({ success: false, message: 'Assigned class not found for teacher' });
      }
      // Our Class model has name and section; we map name -> grade for compatibility
      const teacherGrade = cls.name;
      const teacherSection = cls.section;
      if (String(grade) !== String(teacherGrade) || String(section) !== String(teacherSection)) {
        return res.status(403).json({ success: false, message: `You can only add students to Class ${teacherGrade}-${teacherSection}` });
      }
    }

    // Check if student already exists (including deleted students)
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Enforce unique roll number within grade + section (only for active students)
    const existingRoll = await Student.findOne({ grade, section, rollNumber, deletedAt: null });
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: `Roll number ${rollNumber} already exists for Class ${grade}-${section}`
      });
    }

    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'principal';
    const pendingApproval = !isAdmin; // teachers require approval

    // Get current session
    const Session = require('../models/Session');
    const currentSession = await Session.findOne({ isCurrent: true });
    if (!currentSession) {
      return res.status(400).json({
        success: false,
        message: 'No active session found. Please create or activate a session first.'
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
      parentPhone: parentPhone?.trim(),
      parentEmail: parentEmail?.trim().toLowerCase(),
      pendingApproval,
      currentSession: currentSession.name,
      createdBy: req.user?._id || null
    });

    console.log('Student created successfully:', student._id);

    // Generate parent email and create parent account
    const { generateParentEmail } = require('../utils/parentCredentials');
    const parentEmail = generateParentEmail(parentName, parentPhone, student._id);
    
    // Update student with parent email
    student.parentEmail = parentEmail;
    await student.save();

    // Create parent account (only if not pending approval)
    let parentAccountId = null;
    if (!pendingApproval) {
      try {
        parentAccountId = await createParentAccount({
          parentName,
          parentPhone,
          address,
          name: name?.trim()
        }, student._id);
        
        // Link parent to student
        student.parent = parentAccountId;
        await student.save();
        
        console.log('Parent account created and linked to student');
      } catch (parentError) {
        console.error('Error creating parent account:', parentError);
        // Don't fail student creation if parent account creation fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: pendingApproval ? 'Student submitted for approval' : 'Student created successfully',
      data: {
        ...student.toObject(),
        parentEmail,
        parentAccountCreated: !!parentAccountId
      }
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
    const { page = 1, limit = 20, search = '', grade = '', section = '', session = '' } = req.query;
    const query = { deletedAt: null }; // Only get active (non-deleted) students
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
    
    // Filter by session
    if (session) {
      query.currentSession = session;
    } else {
      // If no session specified, get students from current session
      const Session = require('../models/Session');
      const currentSession = await Session.findOne({ isCurrent: true });
      if (currentSession) {
        query.currentSession = currentSession.name;
      }
    }

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

    // Enforce unique roll number within grade + section (only for active students)
    if (update.rollNumber || update.grade || update.section) {
      const current = await Student.findById(studentId);
      const grade = update.grade || current.grade;
      const section = update.section || current.section;
      const rollNumber = update.rollNumber || current.rollNumber;
      const dup = await Student.findOne({ _id: { $ne: studentId }, grade, section, rollNumber, deletedAt: null });
      if (dup) {
        return res.status(400).json({ success: false, message: `Roll number ${rollNumber} already exists for Class ${grade}-${section}` });
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

// Delete student (soft delete)
exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (student.deletedAt) {
      return res.status(400).json({ success: false, message: 'Student is already deleted' });
    }

    // Soft delete the student
    student.deletedAt = new Date();
    student.deletedBy = req.user._id;
    student.deletionReason = reason || '';
    await student.save();

    res.status(200).json({ 
      success: true, 
      message: 'Student deleted successfully',
      data: student
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
  }
};

// Restore deleted student
exports.restoreStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (!student.deletedAt) {
      return res.status(400).json({ success: false, message: 'Student is not deleted' });
    }

    // Check for roll number conflicts before restoring
    const existingStudent = await Student.findOne({
      _id: { $ne: studentId },
      grade: student.grade,
      section: student.section,
      rollNumber: student.rollNumber,
      deletedAt: null
    });

    if (existingStudent) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot restore student. Roll number ${student.rollNumber} already exists in Class ${student.grade}-${student.section}` 
      });
    }

    // Restore the student
    student.deletedAt = null;
    student.deletedBy = null;
    student.deletionReason = '';
    await student.save();

    res.status(200).json({ 
      success: true, 
      message: 'Student restored successfully',
      data: student
    });
  } catch (error) {
    console.error('Error restoring student:', error);
    res.status(500).json({ success: false, message: 'Error restoring student', error: error.message });
  }
};

// Permanently delete student (hard delete)
exports.permanentlyDeleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (!student.deletedAt) {
      return res.status(400).json({ success: false, message: 'Student must be soft deleted before permanent deletion' });
    }

    // Permanently delete the student
    await Student.findByIdAndDelete(studentId);

    res.status(200).json({ 
      success: true, 
      message: 'Student permanently deleted successfully'
    });
  } catch (error) {
    console.error('Error permanently deleting student:', error);
    res.status(500).json({ success: false, message: 'Error permanently deleting student', error: error.message });
  }
};

// Get deleted students
exports.getDeletedStudents = async (req, res) => {
  try {
    const { search, grade, section } = req.query;
    
    let query = { deletedAt: { $ne: null } };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (grade) query.grade = grade;
    if (section) query.section = section;

    const students = await Student.find(query)
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 });

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching deleted students:', error);
    res.status(500).json({ success: false, message: 'Error fetching deleted students', error: error.message });
  }
};

// Approve pending student (admin/principal)
exports.approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.pendingApproval) {
      return res.status(400).json({ success: false, message: 'Student is already approved' });
    }
    
    student.pendingApproval = false;
    
    // Generate parent email if not already set
    if (!student.parentEmail) {
      const { generateParentEmail } = require('../utils/parentCredentials');
      student.parentEmail = generateParentEmail(student.parentName, student.parentPhone, student._id);
    }
    
    // Create parent account
    let parentAccountId = null;
    try {
      parentAccountId = await createParentAccount({
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        address: student.address,
        name: student.name
      }, student._id);
      
      // Link parent to student
      student.parent = parentAccountId;
      console.log('Parent account created and linked to approved student');
    } catch (parentError) {
      console.error('Error creating parent account for approved student:', parentError);
      // Don't fail approval if parent account creation fails
    }
    
    await student.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Student approved successfully', 
      data: {
        ...student.toObject(),
        parentAccountCreated: !!parentAccountId
      }
    });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({ success: false, message: 'Error approving student', error: error.message });
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

// Update student information
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the student
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if parent email is being updated
    if (updateData.parentEmail && updateData.parentEmail !== student.parentEmail) {
      // Check if parent already exists with new email
      let parent = await Parent.findOne({ email: updateData.parentEmail });
      
      if (parent) {
        // Parent exists, add student to their children if not already there
        if (!parent.children.includes(student._id)) {
          parent.children.push(student._id);
          await parent.save();
        }
        // Remove student from old parent if exists
        if (student.parent) {
          const oldParent = await Parent.findById(student.parent);
          if (oldParent) {
            oldParent.children = oldParent.children.filter(childId => !childId.equals(student._id));
            await oldParent.save();
          }
        }
        student.parent = parent._id;
      } else {
        // Create new parent
        const { parentId, password } = Parent.generateCredentials();
        
        parent = new Parent({
          name: updateData.parentName || student.parentName,
          email: updateData.parentEmail,
          password: password,
          phone: updateData.parentPhone || student.parentPhone,
          address: updateData.address || student.address,
          children: [student._id],
          credentialsGenerated: true,
          credentialsGeneratedAt: new Date()
        });

        await parent.save();
        
        // Remove student from old parent if exists
        if (student.parent) {
          const oldParent = await Parent.findById(student.parent);
          if (oldParent) {
            oldParent.children = oldParent.children.filter(childId => !childId.equals(student._id));
            await oldParent.save();
          }
        }
        
        student.parent = parent._id;

        // Send credentials email
        try {
          const emailSubject = 'Parent Portal Access Credentials - Updated';
          const emailBody = `
            <h2>Parent Portal Access Updated</h2>
            <p>Dear ${parent.name},</p>
            <p>Your parent portal access has been updated for your child ${student.name}.</p>
            
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${updateData.parentEmail}</p>
            <p><strong>Password:</strong> ${password}</p>
            
            <p>You can access the parent portal at: <a href="${process.env.FRONTEND_URL}/parent-login">Parent Portal Login</a></p>
            
            <p>Best regards,<br>School Administration</p>
          `;

          await sendEmail({
            email: updateData.parentEmail,
            subject: emailSubject,
            message: emailBody
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError.message);
        }
      }
    }

    // Update student data
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parent', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
};

// Change parent password
exports.changeParentPassword = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { newPassword } = req.body;

    // Find the student
    const student = await Student.findById(studentId).populate('parent');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!student.parent) {
      return res.status(404).json({
        success: false,
        message: 'No parent account found for this student'
      });
    }

    // Update parent password
    student.parent.password = newPassword || 'parent123'; // Default to simple password
    await student.parent.save();

    res.status(200).json({
      success: true,
      message: 'Parent password updated successfully',
      data: {
        parentEmail: student.parent.email,
        newPassword: student.parent.password
      }
    });

  } catch (error) {
    console.error('Error changing parent password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing parent password',
      error: error.message
    });
  }
};