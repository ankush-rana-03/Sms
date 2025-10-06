const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const { protect, authorize } = require('../middleware/auth');

// Get all results
router.get('/', protect, authorize('teacher', 'admin', 'principal', 'parent'), async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching results', error: error.message });
  }
});

// Create new result
router.post('/', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating result', error: error.message });
  }
});

// Update result
router.put('/:id', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating result', error: error.message });
  }
});

// Delete result
router.delete('/:id', protect, authorize('teacher', 'admin', 'principal'), async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting result', error: error.message });
  }
});

module.exports = router;