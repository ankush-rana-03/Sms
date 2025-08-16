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

    // Check if there are teacher assignments for this class
    // Try multiple query approaches to ensure we find all assignments
    console.log(`\n🔍 Looking for teacher assignments to class: ${classId}`);
    console.log(`Class details: ${cls.name} Section ${cls.section} (${cls.session})`);
    
    // Approach 1: Direct query
    let teachersWithAssignments = await Teacher.find({
      'assignedClasses.class': classId
    });
    
    console.log(`Approach 1 (direct query): Found ${teachersWithAssignments.length} teachers`);

    // Approach 2: If no results, try with string comparison
    if (teachersWithAssignments.length === 0) {
      console.log('No teachers found with direct query, trying string comparison...');
      teachersWithAssignments = await Teacher.find({
        'assignedClasses.class': classId.toString()
      });
      console.log(`Approach 2 (string query): Found ${teachersWithAssignments.length} teachers`);
    }

    // Approach 3: If still no results, get all teachers and filter manually
    if (teachersWithAssignments.length === 0) {
      console.log('No teachers found with string query, trying manual filter...');
      const allTeachers = await Teacher.find({});
      teachersWithAssignments = allTeachers.filter(teacher => 
        teacher.assignedClasses && teacher.assignedClasses.some(assignment => 
          assignment.class && (assignment.class.toString() === classId || assignment.class.toString() === classId.toString())
        )
      );
      console.log(`Approach 3 (manual filter): Found ${teachersWithAssignments.length} teachers`);
    }

    // Log what we found
    if (teachersWithAssignments.length > 0) {
      console.log('\n📋 Teachers with assignments found:');
      teachersWithAssignments.forEach(teacher => {
        console.log(`  - ${teacher.name} (${teacher.email})`);
        const relevantAssignments = teacher.assignedClasses.filter(assignment => 
          assignment.class && (assignment.class.toString() === classId || assignment.class.toString() === classId.toString())
        );
        console.log(`    Relevant assignments: ${relevantAssignments.length}`);
        relevantAssignments.forEach(assignment => {
          console.log(`      * Class: ${assignment.class} (${typeof assignment.class})`);
          console.log(`        Subject: ${assignment.subject}, Section: ${assignment.section}`);
        });
      });
    } else {
      console.log('❌ No teachers found with assignments to this class');
    }

    // Remove assignments for this class from all teachers using multiple approaches
    console.log(`\n🗑️  Removing teacher assignments for class ${classId} from database...`);
    
    let totalModified = 0;
    let deletedAssignments = 0;
    
    // Approach 1: Try to find and remove assignments using the class ID
    console.log('🔍 Approach 1: Searching for teachers with assignments to this class...');
    
    // Log the actual assignment data to see what's stored
    if (teachersWithAssignments.length > 0) {
      console.log('\n📋 Current assignment data:');
      teachersWithAssignments.forEach(teacher => {
        console.log(`\nTeacher: ${teacher.name}`);
        teacher.assignedClasses.forEach((assignment, index) => {
          console.log(`  Assignment ${index}:`, {
            class: assignment.class,
            classType: typeof assignment.class,
            classId: assignment.class?._id || assignment.class,
            classIdType: typeof (assignment.class?._id || assignment.class),
            subject: assignment.subject,
            section: assignment.section
          });
        });
      });
    }
    
    // Approach 2: Use $pull with exact match
    console.log('\n🗑️  Approach 2: Using $pull with exact ObjectId match...');
    const updateResult1 = await Teacher.updateMany(
      { 'assignedClasses.class': classId },
      { $pull: { assignedClasses: { class: classId } } }
    );
    console.log(`Update result 1:`, updateResult1);
    totalModified += updateResult1.modifiedCount || 0;
    
    // Approach 3: Use $pull with string match
    console.log('\n🗑️  Approach 3: Using $pull with string match...');
    const updateResult2 = await Teacher.updateMany(
      { 'assignedClasses.class': classId.toString() },
      { $pull: { assignedClasses: { class: classId.toString() } } }
    );
    console.log(`Update result 2:`, updateResult2);
    totalModified += updateResult2.modifiedCount || 0;
    
    // Approach 4: Use $pull with $in operator to catch any variations
    console.log('\n🗑️  Approach 4: Using $pull with $in operator...');
    const updateResult3 = await Teacher.updateMany(
      {},
      { $pull: { assignedClasses: { class: { $in: [classId, classId.toString()] } } } }
    );
    console.log(`Update result 3:`, updateResult3);
    totalModified += updateResult3.modifiedCount || 0;
    
    // Approach 5: Manual removal as last resort
    console.log('\n🗑️  Approach 5: Manual removal as last resort...');
    const allTeachers = await Teacher.find({});
    let manualRemovals = 0;
    
    for (const teacher of allTeachers) {
      if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
        const originalLength = teacher.assignedClasses.length;
        
        // Remove assignments that match this class (any format)
        teacher.assignedClasses = teacher.assignedClasses.filter(assignment => {
          const assignmentClassId = assignment.class?._id || assignment.class;
          const assignmentClassIdString = assignmentClassId?.toString();
          const targetClassIdString = classId.toString();
          
          const shouldRemove = assignmentClassIdString === targetClassIdString;
          
          if (shouldRemove) {
            console.log(`  Removing assignment for teacher ${teacher.name}:`, {
              class: assignmentClassId,
              subject: assignment.subject,
              section: assignment.section
            });
          }
          
          return !shouldRemove;
        });
        
        const newLength = teacher.assignedClasses.length;
        const removed = originalLength - newLength;
        
        if (removed > 0) {
          await teacher.save();
          manualRemovals += removed;
          console.log(`  ✅ Teacher ${teacher.name}: removed ${removed} assignments`);
        }
      }
    }
    
    totalModified += manualRemovals;
    deletedAssignments = totalModified;
    
    console.log(`\n📊 Total assignments removed: ${totalModified}`);
    console.log(`  - Database updates: ${(updateResult1.modifiedCount || 0) + (updateResult2.modifiedCount || 0) + (updateResult3.modifiedCount || 0)}`);
    console.log(`  - Manual removals: ${manualRemovals}`);
    
    // Final verification
    console.log('\n🔍 Final verification: Checking for remaining assignments...');
    const remainingAssignments = await Teacher.find({
      $or: [
        { 'assignedClasses.class': classId },
        { 'assignedClasses.class': classId.toString() }
      ]
    });
    
    if (remainingAssignments.length > 0) {
      console.log(`⚠️  Warning: ${remainingAssignments.length} teachers still have assignments to this class`);
      remainingAssignments.forEach(teacher => {
        console.log(`  - ${teacher.name}: ${teacher.assignedClasses.length} assignments`);
        teacher.assignedClasses.forEach(assignment => {
          console.log(`    * Class: ${assignment.class} (${typeof assignment.class})`);
        });
      });
    } else {
      console.log(`✅ All teacher assignments to class ${classId} have been successfully removed`);
    }

    // Also check for any other potential references to this class
    // Check if this class is referenced in any other models
    const studentsInClass = await Student.find({ 
      grade: cls.name, 
      section: cls.section,
      currentSession: cls.session,
      deletedAt: null 
    });

    if (studentsInClass.length > 0) {
      console.log(`⚠️  Warning: Found ${studentsInClass.length} students still enrolled in this class`);
    }

    // Direct database updates are more reliable than manual filtering
    console.log('✅ Using direct database updates for reliable assignment removal');

    // Check for any other potential references (Homework, Tests, Results, etc.)
    console.log('\n🗑️  Cleaning up related data for this class...');
    
    try {
      const Homework = require('../models/Homework');
      const homeworkInClass = await Homework.find({ 
        class: classId 
      });

      if (homeworkInClass.length > 0) {
        console.log(`Found ${homeworkInClass.length} homework assignments for this class - deleting...`);
        await Homework.deleteMany({ class: classId });
        console.log(`✅ Deleted ${homeworkInClass.length} homework assignments`);
      }
    } catch (error) {
      console.log('Homework model not found, skipping homework cleanup');
    }

    try {
      const Test = require('../models/Test');
      const testsInClass = await Test.find({ 
        class: classId 
      });

      if (testsInClass.length > 0) {
        console.log(`Found ${testsInClass.length} tests for this class - deleting...`);
        await Test.deleteMany({ class: classId });
        console.log(`✅ Deleted ${testsInClass.length} tests`);
      }
    } catch (error) {
      console.log('Test model not found, skipping test cleanup');
    }

    try {
      const Result = require('../models/Result');
      const resultsInClass = await Result.find({ 
        classId: classId 
      });

      if (resultsInClass.length > 0) {
        console.log(`Found ${resultsInClass.length} results for this class - deleting...`);
        await Result.deleteMany({ classId: classId });
        console.log(`✅ Deleted ${resultsInClass.length} results`);
      }
    } catch (error) {
      console.log('Result model not found, skipping result cleanup');
    }

    try {
      const Attendance = require('../models/Attendance');
      const attendanceInClass = await Attendance.find({ 
        classId: classId 
      });

      if (attendanceInClass.length > 0) {
        console.log(`Found ${attendanceInClass.length} attendance records for this class - deleting...`);
        await Attendance.deleteMany({ classId: classId });
        console.log(`✅ Deleted ${attendanceInClass.length} attendance records`);
      }
    } catch (error) {
      console.log('Attendance model not found, skipping attendance cleanup');
    }

    // Unassign class teacher if assigned
    if (cls.classTeacher) {
      await Teacher.findByIdAndUpdate(cls.classTeacher, { 
        isClassTeacher: false, 
        classTeacherOf: null 
      });
    }

    // Delete the class
    await Class.findByIdAndDelete(classId);

    console.log(`✅ Class "${cls.name} Section ${cls.section}" deleted successfully`);
    console.log(`✅ Cleaned up ${deletedAssignments} teacher assignments`);
    console.log(`✅ Cleaned up class teacher assignment`);

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
      deletedClass: {
        name: cls.name,
        section: cls.section,
        session: cls.session
      },
      deletedAssignments: deletedAssignments,
      cleanupSummary: {
        teacherAssignmentsRemoved: deletedAssignments,
        classTeacherUnassigned: !!cls.classTeacher,
        studentsEnrolled: studentsInClass.length,
        warnings: [
          studentsInClass.length > 0 ? `${studentsInClass.length} students still enrolled` : null,
          deletedAssignments > 0 ? `${deletedAssignments} teacher assignments removed` : null
        ].filter(Boolean)
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