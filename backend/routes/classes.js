const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');

// Get all classes
router.get('/', protect, authorize('admin', 'principal', 'teacher'), async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .select('name section academicYear roomNumber capacity currentStrength')
      .sort({ name: 1, section: 1 });

    // Transform data to match frontend expectations
    const transformedClasses = classes.map(cls => ({
      _id: cls._id,
      name: cls.name,
      section: cls.section,
      grade: cls.name.replace('Class ', ''), // Extract grade from name
      academicYear: cls.academicYear,
      roomNumber: cls.roomNumber,
      capacity: cls.capacity,
      currentStrength: cls.currentStrength
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

// Get assignments for a specific class (class-wise subjects and teachers)
router.get('/:classId/assignments', protect, authorize('admin', 'principal', 'teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const teachers = await Teacher.find({ 'assignedClasses.class': classId })
      .select('name email assignedClasses')
      .populate('assignedClasses.class', 'name section');

    // Build class-wise list
    const assignments = [];
    for (const teacher of teachers) {
      for (const ac of teacher.assignedClasses) {
        const acClassId = typeof ac.class === 'object' && ac.class ? String(ac.class._id) : String(ac.class);
        if (acClassId === String(classId)) {
          assignments.push({
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            subject: ac.subject,
            day: ac.day,
            time: ac.time,
            section: ac.section
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      class: { _id: cls._id, name: cls.name, section: cls.section },
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching class assignments:', error);
    res.status(500).json({ success: false, message: 'Error fetching class assignments', error: error.message });
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

    // Check if class already exists
    const existingClass = await Class.findOne({ name, section, academicYear });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class with this name, section, and academic year already exists'
      });
    }

    const newClass = await Class.create({
      name,
      section,
      academicYear,
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
    res.status(500).json({
      success: false,
      message: 'Error creating class',
      error: error.message
    });
  }
});

// Delete class (admin only) - used for tests and cleanup
router.delete('/:classId', protect, authorize('admin'), async (req, res) => {
  try {
    const { classId } = req.params;
    const deleted = await Class.findByIdAndDelete(classId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    res.status(200).json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ success: false, message: 'Error deleting class', error: error.message });
  }
});

module.exports = router;