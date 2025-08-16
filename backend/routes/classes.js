const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

// Get all classes
router.get('/', protect, authorize('admin', 'principal', 'teacher'), async (req, res) => {
  try {
    const { session } = req.query;
    
    let query = { isActive: true };
    if (session) {
      query.session = session;
    } else {
      // If no session specified, get classes from current session
      const Session = require('../models/Session');
      const currentSession = await Session.findOne({ isCurrent: true });
      if (currentSession) {
        query.session = currentSession.name;
      }
    }

    const classes = await Class.find(query)
      .select('name section academicYear session roomNumber capacity currentStrength classTeacher isActiveSession')
      .populate('classTeacher', 'name email');

    // Transform data to match frontend expectations
    const transformedClasses = classes.map(cls => ({
      _id: cls._id,
      name: cls.name,
      section: cls.section,
      grade: cls.name.replace('Class ', ''), // Extract grade from name
      academicYear: cls.academicYear,
      session: cls.session,
      roomNumber: cls.roomNumber,
      capacity: cls.capacity,
      currentStrength: cls.currentStrength,
      isActiveSession: cls.isActiveSession,
      classTeacher: cls.classTeacher ? { _id: cls.classTeacher._id, name: cls.classTeacher.name, email: cls.classTeacher.email } : null
    }));

    res.status(200).json({
      success: true,
      data: transformedClasses
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classes',
      error: error.message
    });
  }
});

// Create new class
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, section, academicYear, roomNumber, capacity } = req.body;

    // Validate required fields
    if (!name || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Name, section, and academic year are required'
      });
    }

    // Get current session
    const Session = require('../models/Session');
    const currentSession = await Session.findOne({ isCurrent: true });
    if (!currentSession) {
      return res.status(400).json({
        success: false,
        message: 'No active session found. Please create or activate a session first.'
      });
    }

    // Check if class already exists in current session
    const existingClass = await Class.findOne({ 
      name, 
      section, 
      session: currentSession.name 
    });
    
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: `Class ${name} Section ${section} already exists in the current session (${currentSession.name})`
      });
    }

    const newClass = await Class.create({
      name,
      section,
      academicYear,
      session: currentSession.name,
      roomNumber,
      capacity: capacity || 40
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error) {
    console.error('Error creating class:', error);
    
    // Handle specific MongoDB duplicate key errors
    if (error.code === 11000) {
      const duplicateFields = Object.keys(error.keyPattern || {});
      if (duplicateFields.includes('name') && duplicateFields.includes('section') && duplicateFields.includes('session')) {
        return res.status(409).json({
          success: false,
          message: `A class with name "${name}" and section "${section}" already exists in the current session.`
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating class',
      error: error.message
    });
  }
});

// Assign class teacher
router.put('/:classId/class-teacher', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'teacherId is required' });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    if (teacher.isActive === false) return res.status(400).json({ success: false, message: 'Cannot assign an inactive teacher' });

    // If this class already has a class teacher, clear that teacher's flags
    if (cls.classTeacher && String(cls.classTeacher) !== String(teacherId)) {
      await Teacher.findByIdAndUpdate(cls.classTeacher, { isClassTeacher: false, classTeacherOf: null });
    }

    // If this teacher is class teacher of another class, clear that class
    if (teacher.classTeacherOf && String(teacher.classTeacherOf) !== String(classId)) {
      await Class.findByIdAndUpdate(teacher.classTeacherOf, { $unset: { classTeacher: 1 } });
    }

    // Set up new links
    cls.classTeacher = teacher._id;
    await cls.save();

    teacher.isClassTeacher = true;
    teacher.classTeacherOf = cls._id;
    await teacher.save();

    const populated = await Class.findById(classId).select('name section classTeacher').populate('classTeacher', 'name email');

    res.status(200).json({ success: true, message: 'Class teacher assigned', data: {
      _id: populated._id,
      name: populated.name,
      section: populated.section,
      classTeacher: populated.classTeacher ? { _id: populated.classTeacher._id, name: populated.classTeacher.name, email: populated.classTeacher.email } : null
    }});
  } catch (error) {
    console.error('Error assigning class teacher:', error);
    res.status(500).json({ success: false, message: 'Error assigning class teacher', error: error.message });
  }
});

// Delete individual class
router.delete('/:classId', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Find the class
    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ 
        success: false, 
        message: 'Class not found' 
      });
    }

    // Check if there are students enrolled in this class
    const Student = require('../models/Student');
    const enrolledStudents = await Student.find({ 
      grade: cls.name, 
      section: cls.section,
      currentSession: cls.session,
      deletedAt: null // Only check active students
    });

    if (enrolledStudents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class. There are ${enrolledStudents.length} student(s) enrolled in this class. Please reassign or remove students first.`
      });
    }

    console.log(`\n🗑️  Starting cleanup for class: ${cls.name} Section ${cls.section} (${cls.session})`);

    // 1. Clean up teacher assignments
    console.log('\n📋 Step 1: Cleaning up teacher assignments...');
    let teacherAssignmentsRemoved = 0;
    
    const Teacher = require('../models/Teacher');
    
    // Remove all teacher assignments for this class
    const teacherUpdateResult = await Teacher.updateMany(
      { 'assignedClasses.class': classId },
      { $pull: { assignedClasses: { class: classId } } }
    );
    
    teacherAssignmentsRemoved = teacherUpdateResult.modifiedCount || 0;
    console.log(`✅ Removed ${teacherAssignmentsRemoved} teacher assignments`);

    // 2. Clean up homework assignments
    console.log('\n📚 Step 2: Cleaning up homework assignments...');
    let homeworkRemoved = 0;
    
    try {
      const Homework = require('../models/Homework');
      const homeworkResult = await Homework.deleteMany({ class: classId });
      homeworkRemoved = homeworkResult.deletedCount || 0;
      console.log(`✅ Removed ${homeworkRemoved} homework assignments`);
    } catch (error) {
      console.log('⚠️  Homework model not found, skipping homework cleanup');
    }

    // 3. Clean up tests
    console.log('\n📝 Step 3: Cleaning up tests...');
    let testsRemoved = 0;
    
    try {
      const Test = require('../models/Test');
      const testResult = await Test.deleteMany({ class: classId });
      testsRemoved = testResult.deletedCount || 0;
      console.log(`✅ Removed ${testsRemoved} tests`);
    } catch (error) {
      console.log('⚠️  Test model not found, skipping test cleanup');
    }

    // 4. Clean up results
    console.log('\n📊 Step 4: Cleaning up results...');
    let resultsRemoved = 0;
    
    try {
      const Result = require('../models/Result');
      const resultResult = await Result.deleteMany({ classId: classId });
      resultsRemoved = resultResult.deletedCount || 0;
      console.log(`✅ Removed ${resultsRemoved} results`);
    } catch (error) {
      console.log('⚠️  Result model not found, skipping result cleanup');
    }

    // 5. Clean up attendance records
    console.log('\n📅 Step 5: Cleaning up attendance records...');
    let attendanceRemoved = 0;
    
    try {
      const Attendance = require('../models/Attendance');
      const attendanceResult = await Attendance.deleteMany({ classId: classId });
      attendanceRemoved = attendanceResult.deletedCount || 0;
      console.log(`✅ Removed ${attendanceRemoved} attendance records`);
    } catch (error) {
      console.log('⚠️  Attendance model not found, skipping attendance cleanup');
    }

    // 6. Clean up archived class data in sessions
    console.log('\n📚 Step 6: Cleaning up archived class data in sessions...');
    let archivedClassDataRemoved = 0;
    
    try {
      const Session = require('../models/Session');
      const sessionUpdateResult = await Session.updateMany(
        { 'archivedData.classes.classId': classId },
        { $pull: { 'archivedData.classes': { classId: classId } } }
      );
      archivedClassDataRemoved = sessionUpdateResult.modifiedCount || 0;
      console.log(`✅ Removed archived class data from ${archivedClassDataRemoved} sessions`);
    } catch (error) {
      console.log('⚠️  Error cleaning up archived class data:', error.message);
    }

    // 7. Unassign class teacher if assigned
    console.log('\n👨‍🏫 Step 7: Unassigning class teacher...');
    let classTeacherUnassigned = false;
    
    if (cls.classTeacher) {
      await Teacher.findByIdAndUpdate(cls.classTeacher, { 
        isClassTeacher: false, 
        classTeacherOf: null 
      });
      classTeacherUnassigned = true;
      console.log('✅ Class teacher unassigned');
    } else {
      console.log('ℹ️  No class teacher assigned');
    }

    // 8. Delete the class
    console.log('\n🗑️  Step 8: Deleting the class...');
    await Class.findByIdAndDelete(classId);
    console.log('✅ Class deleted successfully');

    // Summary
    const totalItemsRemoved = teacherAssignmentsRemoved + homeworkRemoved + testsRemoved + resultsRemoved + attendanceRemoved + archivedClassDataRemoved;
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`  - Teacher assignments: ${teacherAssignmentsRemoved}`);
    console.log(`  - Homework assignments: ${homeworkRemoved}`);
    console.log(`  - Tests: ${testsRemoved}`);
    console.log(`  - Results: ${resultsRemoved}`);
    console.log(`  - Attendance records: ${attendanceRemoved}`);
    console.log(`  - Archived class data: ${archivedClassDataRemoved}`);
    console.log(`  - Total items removed: ${totalItemsRemoved}`);

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
      deletedClass: {
        name: cls.name,
        section: cls.section,
        session: cls.session
      },
      cleanupSummary: {
        teacherAssignmentsRemoved,
        homeworkRemoved,
        testsRemoved,
        resultsRemoved,
        attendanceRemoved,
        archivedClassDataRemoved,
        totalItemsRemoved,
        classTeacherUnassigned
      }
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting class', 
      error: error.message 
    });
  }
});

// Unassign class teacher
router.delete('/:classId/class-teacher', protect, authorize('admin', 'principal'), async (req, res) => {
  try {
    const { classId } = req.params;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });

    if (cls.classTeacher) {
      // Clear teacher flags
      await Teacher.findByIdAndUpdate(cls.classTeacher, { isClassTeacher: false, classTeacherOf: null });
      // Clear class link
      cls.classTeacher = undefined;
      await cls.save();
    }

    res.status(200).json({ success: true, message: 'Class teacher unassigned' });
  } catch (error) {
    console.error('Error unassigning class teacher:', error);
    res.status(500).json({ success: false, message: 'Error unassigning class teacher', error: error.message });
  }
});

// Get available classes and sections for student registration
router.get('/available-for-registration', protect, async (req, res) => {
  try {
    // Get current session
    const Session = require('../models/Session');
    const currentSession = await Session.findOne({ isCurrent: true });
    
    if (!currentSession) {
      return res.status(400).json({
        success: false,
        message: 'No active session found. Please create or activate a session first.'
      });
    }

    // Get all active classes from current session
    const classes = await Class.find({ 
      session: currentSession.name,
      isActive: true 
    }).select('name section');

    // Extract unique class names and sections
    const classNames = [...new Set(classes.map(cls => cls.name))].sort((a, b) => {
      // Custom sorting: nursery, lkg, ukg, then numeric classes
      const order = { 'nursery': 0, 'lkg': 1, 'ukg': 2 };
      const aOrder = order[a] !== undefined ? order[a] : parseInt(a) + 3;
      const bOrder = order[b] !== undefined ? order[b] : parseInt(b) + 3;
      return aOrder - bOrder;
    });

    const sections = [...new Set(classes.map(cls => cls.section))].sort();

    // Get sections for each class
    const classesWithSections = classNames.map(className => {
      const classSections = classes
        .filter(cls => cls.name === className)
        .map(cls => cls.section)
        .sort();
      
      return {
        name: className,
        displayName: className === 'nursery' ? 'Nursery' : 
                    className === 'lkg' ? 'LKG' : 
                    className === 'ukg' ? 'UKG' : 
                    `Class ${className}`,
        sections: classSections
      };
    });

    res.status(200).json({
      success: true,
      data: {
        classes: classesWithSections,
        sections: sections,
        currentSession: currentSession.name
      }
    });
  } catch (error) {
    console.error('Error fetching available classes for registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available classes for registration',
      error: error.message
    });
  }
});

module.exports = router;