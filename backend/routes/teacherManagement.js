const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
  getTeacherLoginLogs,
  getTeacherStatus,
  updateTeacherStatus,
  getOnlineTeachers,
  assignClassesToTeacher,
  getTeacherStatistics,
  deleteSubjectAssignment,
  updateSubjectAssignment
} = require('../controllers/teacherManagement');

// All routes require admin authorization
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/teachers:
 *   get:
 *     summary: Get all teachers
 *     tags: [Admin - Teachers]
 *     responses:
 *       200:
 *         description: List of teachers
 *   post:
 *     summary: Create a new teacher
 *     tags: [Admin - Teachers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Teacher created
 */

/**
 * @swagger
 * /api/admin/teachers/{teacherId}:
 *   put:
 *     summary: Update a teacher
 *     tags: [Admin - Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Teacher updated
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Admin - Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teacher deleted
 */

/**
 * @swagger
 * /api/admin/teachers/{teacherId}/reset-password:
 *   post:
 *     summary: Reset teacher password
 *     tags: [Admin - Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Password reset
 */

/**
 * @swagger
 * /api/admin/teachers/{teacherId}/login-logs:
 *   get:
 *     summary: Get teacher login logs
 *     tags: [Admin - Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Login logs
 */

/**
 * @swagger
 * /api/admin/teachers/{teacherId}/status:
 *   get:
 *     summary: Get teacher status
 *     tags: [Admin - Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teacher status
 *   put:
 *     summary: Update teacher status
 *     tags: [Admin - Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Status updated
 */

/**
 * @swagger
 * /api/admin/teachers/{teacherId}/assign-classes:
 *   post:
 *     summary: Assign classes to teacher
 *     tags: [Admin - Teachers]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedClasses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     class:
 *                       type: string
 *                     section:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     grade:
 *                       type: string
 *                     time:
 *                       type: string
 *                     day:
 *                       type: string
 *     responses:
 *       200:
 *         description: Classes assigned
 */

/**
 * @swagger
 * /api/admin/teachers/online/teachers:
 *   get:
 *     summary: Get online teachers
 *     tags: [Admin - Teachers]
 *     responses:
 *       200:
 *         description: Online teachers
 */

/**
 * @swagger
 * /api/admin/teachers/statistics/overview:
 *   get:
 *     summary: Get teacher statistics overview
 *     tags: [Admin - Teachers]
 *     responses:
 *       200:
 *         description: Statistics overview
 */

// Teacher CRUD operations
router.get('/', getAllTeachers);
router.get('/:teacherId', getTeacherById);
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
router.delete('/:teacherId/subject-assignment', deleteSubjectAssignment);
router.put('/:teacherId/subject-assignment', updateSubjectAssignment);

// Statistics and monitoring
router.get('/online/teachers', getOnlineTeachers);
router.get('/statistics/overview', getTeacherStatistics);

module.exports = router;