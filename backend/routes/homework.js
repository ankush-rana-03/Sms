const express = require('express');
const router = express.Router();
const Homework = require('../models/Homework');
const { protect, authorize } = require('../middleware/auth');

// Get all homework
router.get('/', protect, authorize('teacher', 'admin', 'principal', 'parent'), async (req, res) => {
  try {
    const homework = await Homework.find()
      .populate('class', 'name section')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching homework', error: error.message });
  }
});

// Create new homework
router.post('/', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    // Add the assignedBy field from the authenticated user
    req.body.assignedBy = req.user.id;
    
    // If class and section are provided as strings, find the actual class ID
    if (req.body.class && req.body.section) {
      const Class = require('../models/Class');
      const Session = require('../models/Session');
      
      // Get current session
      const currentSession = await Session.findOne({ isCurrent: true });
      if (!currentSession) {
        return res.status(400).json({ 
          success: false, 
          message: 'No active session found' 
        });
      }
      
      // Find the class by name and section
      const classDoc = await Class.findOne({
        name: req.body.class,
        section: req.body.section,
        session: currentSession.name,
        isActive: true
      });
      
      if (!classDoc) {
        return res.status(400).json({ 
          success: false, 
          message: `Class ${req.body.class} Section ${req.body.section} not found` 
        });
      }
      
      // Replace class name with actual class ID
      req.body.class = classDoc._id;
    }
    
    const homework = new Homework(req.body);
    await homework.save();
    res.status(201).json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating homework', error: error.message });
  }
});

// Update homework
router.put('/:id', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const homework = await Homework.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating homework', error: error.message });
  }
});

// Delete homework
router.delete('/:id', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const homework = await Homework.findByIdAndDelete(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: 'Homework not found' });
    }
    res.json({ success: true, message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting homework', error: error.message });
  }
});

module.exports = router;