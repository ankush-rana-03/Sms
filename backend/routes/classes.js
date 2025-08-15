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