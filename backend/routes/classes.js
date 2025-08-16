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
    const teachersWithAssignments = await Teacher.find({
      'assignedClasses.class': classId
    });

    console.log(`Found ${teachersWithAssignments.length} teachers with assignments to class ${classId}`);

    // Remove assignments for this class from all teachers
    let deletedAssignments = 0;
    for (const teacher of teachersWithAssignments) {
      console.log(`Processing teacher: ${teacher.name} (ID: ${teacher._id})`);
      console.log(`Original assignments count: ${teacher.assignedClasses.length}`);
      
      const originalLength = teacher.assignedClasses.length;
      
      // Filter out all assignments to this class (in case there are duplicates)
      const assignmentsToRemove = teacher.assignedClasses.filter(
        assignment => assignment.class.toString() === classId
      );
      
      teacher.assignedClasses = teacher.assignedClasses.filter(
        assignment => assignment.class.toString() !== classId
      );
      
      const newLength = teacher.assignedClasses.length;
      const removedCount = originalLength - newLength;
      deletedAssignments += removedCount;
      
      console.log(`Found ${assignmentsToRemove.length} assignments to remove for class ${classId}`);
      console.log(`After filtering: ${newLength} assignments remaining, ${removedCount} removed`);
      
      if (removedCount > 0) {
        await teacher.save();
        console.log(`Teacher ${teacher.name} saved successfully with ${removedCount} assignments removed`);
      }
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
      console.log(`Warning: Found ${studentsInClass.length} students still enrolled in this class`);
    }

    // Check for any other potential references (Homework, Tests, Results, etc.)
    try {
      const Homework = require('../models/Homework');
      const homeworkInClass = await Homework.find({ 
        class: classId 
      });

      if (homeworkInClass.length > 0) {
        console.log(`Warning: Found ${homeworkInClass.length} homework assignments for this class`);
        // Optionally delete homework assignments for this class
        // await Homework.deleteMany({ class: classId });
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
        console.log(`Warning: Found ${testsInClass.length} tests for this class`);
        // Optionally delete tests for this class
        // await Test.deleteMany({ class: classId });
      }
    } catch (error) {
      console.log('Test model not found, skipping test cleanup');
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