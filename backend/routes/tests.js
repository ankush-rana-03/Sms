const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');

// Get all tests
router.get('/', protect, authorize('teacher', 'admin', 'principal', 'parent'), async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tests', error: error.message });
  }
});

// Create new test
router.post('/', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const test = new Test(req.body);
    await test.save();
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating test', error: error.message });
  }
});

// Update test
router.put('/:id', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating test', error: error.message });
  }
});

// Delete test
router.delete('/:id', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting test', error: error.message });
  }
});

module.exports = router;