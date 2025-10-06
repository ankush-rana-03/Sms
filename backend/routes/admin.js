const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Teacher = require('../models/Teacher');

// Get all teachers for admin management
router.get('/teachers', protect, authorize('admin'), async (req, res) => {
  try {
    const teachers = await Teacher.find({}).select('name email phone designation subjects qualification experience isActive');
    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers',
      error: error.message
    });
  }
});

module.exports = router;