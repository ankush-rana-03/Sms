const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  approveStudent,
  getStudentAttendance,
  getAllStudentsTest
} = require('../controllers/students');

// Test route (no authentication required for debugging)
router.get('/test/all', getAllStudentsTest);

// Student routes
router.post('/', protect, authorize('admin', 'principal'), createStudent);
router.get('/', protect, authorize('admin', 'principal', 'teacher'), getStudents);
router.put('/:studentId', protect, authorize('admin', 'principal'), updateStudent);
router.delete('/:studentId', protect, authorize('admin', 'principal'), deleteStudent);
router.put('/:studentId/approve', protect, authorize('admin', 'principal'), approveStudent);

// Attendance routes
router.get('/:studentId/attendance', protect, authorize('teacher', 'admin'), getStudentAttendance);

module.exports = router;