const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  restoreStudent,
  permanentlyDeleteStudent,
  getDeletedStudents,
  approveStudent,
  getStudentAttendance,
  getAllStudentsTest
} = require('../controllers/students');

// Test route (no authentication required for debugging)
router.get('/test/all', getAllStudentsTest);

// Student routes
router.post('/', protect, authorize('admin', 'principal', 'teacher'), createStudent);
router.get('/', protect, authorize('admin', 'principal', 'teacher'), getStudents);
router.put('/:studentId', protect, authorize('admin', 'principal'), updateStudent);
router.delete('/:studentId', protect, authorize('admin', 'principal'), deleteStudent);
router.put('/:studentId/approve', protect, authorize('admin', 'principal'), approveStudent);

// Soft delete management routes
router.get('/deleted', protect, authorize('admin', 'principal'), getDeletedStudents);
router.put('/:studentId/restore', protect, authorize('admin', 'principal'), restoreStudent);
router.delete('/:studentId/permanent', protect, authorize('admin', 'principal'), permanentlyDeleteStudent);

// Attendance routes
router.get('/:studentId/attendance', protect, authorize('teacher', 'admin'), getStudentAttendance);

module.exports = router;