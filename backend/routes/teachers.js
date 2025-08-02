const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStudentsByClass,
  markAttendance,
  getStudentAttendance,
  getTodayAttendance
} = require('../controllers/teachers');

// All routes require authentication and teacher role
router.use(protect);
router.use(authorize('teacher', 'admin'));

// Get students by class and section
router.get('/students', getStudentsByClass);

// Mark attendance for a student
router.post('/attendance', markAttendance);

// Get attendance for a specific student
router.get('/attendance/student/:studentId', getStudentAttendance);

// Get today's attendance for a class
router.get('/attendance/today', getTodayAttendance);

module.exports = router;