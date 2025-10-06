const express = require('express');
const router = express.Router();
const Homework = require('../models/Homework');
const { protect, authorize } = require('../middleware/auth');

// Get all homework
router.get('/', protect, authorize('teacher', 'admin', 'principal', 'parent'), async (req, res) => {
  try {
    const homework = await Homework.find().sort({ createdAt: -1 });
    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching homework', error: error.message });
  }
});

// Create new homework
router.post('/', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
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