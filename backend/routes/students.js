const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createStudent,
  getStudents,
  markAttendanceWithFace,
  getStudentAttendance
} = require('../controllers/students');

// Student routes
router.post('/', protect, authorize('admin', 'principal'), createStudent);
router.get('/', protect, authorize('admin', 'principal', 'teacher'), getStudents);

// Attendance routes
router.post('/attendance/face', protect, authorize('teacher', 'admin'), markAttendanceWithFace);
router.get('/:studentId/attendance', protect, authorize('teacher', 'admin'), getStudentAttendance);

module.exports = router;