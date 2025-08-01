const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Placeholder for student management routes
router.get('/', protect, authorize('admin', 'principal', 'teacher'), (req, res) => {
  res.json({ message: 'Student management routes' });
});

module.exports = router;