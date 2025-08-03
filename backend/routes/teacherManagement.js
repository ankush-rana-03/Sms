const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
  getTeacherLoginLogs,
  getTeacherStatus,
  updateTeacherStatus,
  getOnlineTeachers,
  assignClassesToTeacher,
  getTeacherStatistics
} = require('../controllers/teacherManagement');

// All routes require admin authorization
router.use(protect, authorize('admin'));

// Teacher CRUD operations
router.get('/', getAllTeachers);
router.post('/', createTeacher);
router.put('/:teacherId', updateTeacher);
router.delete('/:teacherId', deleteTeacher);

// Password management
router.post('/:teacherId/reset-password', resetTeacherPassword);

// Login logs and monitoring
router.get('/:teacherId/login-logs', getTeacherLoginLogs);
router.get('/:teacherId/status', getTeacherStatus);
router.put('/:teacherId/status', updateTeacherStatus);

// Class assignments
router.post('/:teacherId/assign-classes', assignClassesToTeacher);

// Statistics and monitoring
router.get('/online/teachers', getOnlineTeachers);
router.get('/statistics/overview', getTeacherStatistics);

module.exports = router;