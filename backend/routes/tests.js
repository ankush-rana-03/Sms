const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Placeholder for test management routes
router.get('/', protect, authorize('teacher', 'admin', 'principal', 'parent'), (req, res) => {
  res.json({ message: 'Test management routes' });
});

module.exports = router;