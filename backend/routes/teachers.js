const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStudentsByClass,
  markAttendance,
  getStudentAttendance,
  getTodayAttendance,
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
  getTeacherStatus,
  updateTeacherStatus
} = require('../controllers/teachers');

// Teacher attendance routes
router.get('/students', protect, authorize('teacher', 'admin'), getStudentsByClass);
router.post('/attendance', protect, authorize('teacher', 'admin'), markAttendance);
router.get('/students/:studentId/attendance', protect, authorize('teacher', 'admin'), getStudentAttendance);
router.get('/today-attendance', protect, authorize('teacher', 'admin'), getTodayAttendance);

// Teacher management routes (admin only)
router.get('/management', protect, authorize('admin'), getAllTeachers);
router.post('/management', protect, authorize('admin'), createTeacher);
router.put('/management/:teacherId', protect, authorize('admin'), updateTeacher);
router.delete('/management/:teacherId', protect, authorize('admin'), deleteTeacher);
router.post('/management/:teacherId/reset-password', protect, authorize('admin'), resetTeacherPassword);
router.get('/management/:teacherId/status', protect, authorize('admin'), getTeacherStatus);
router.put('/management/:teacherId/status', protect, authorize('admin'), updateTeacherStatus);

module.exports = router;