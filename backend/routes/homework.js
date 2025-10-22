const express = require('express');
const router = express.Router();
const {
  getAllHomework,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
  getHomeworkByClassSection,
  getHomeworkStatistics,
  submitHomework,
  gradeHomework
} = require('../controllers/homework');
const { protect, authorize } = require('../middleware/auth');

// Get all homework
router.get('/', protect, authorize('teacher', 'admin', 'principal', 'parent'), getAllHomework);

// Get homework by ID
router.get('/:id', protect, authorize('teacher', 'admin', 'principal', 'parent'), getHomeworkById);

// Get homework by class and section
router.get('/class/:className/section/:sectionName', protect, authorize('teacher', 'admin', 'principal', 'parent'), getHomeworkByClassSection);

// Get homework statistics
router.get('/statistics', protect, authorize('admin', 'principal'), getHomeworkStatistics);

// Create new homework
router.post('/', protect, authorize('teacher', 'admin', 'principal'), createHomework);

// Submit homework (for students)
router.post('/:id/submit', protect, authorize('student'), submitHomework);

// Grade homework (for teachers)
router.post('/:id/grade', protect, authorize('teacher', 'admin', 'principal'), gradeHomework);

// Update homework
router.put('/:id', protect, authorize('teacher', 'admin', 'principal'), updateHomework);

// Delete homework
router.delete('/:id', protect, authorize('teacher', 'admin', 'principal'), deleteHomework);

module.exports = router;