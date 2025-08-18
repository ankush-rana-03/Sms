const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const attendanceController = require('./attendance');

// Get students by class and optional section
exports.getStudentsByClass = async (req, res) => {
  try {
    const { grade, section } = req.query;
    if (!grade) {
      return res.status(400).json({ success: false, message: 'Class (grade) is required' });
    }

    const query = { grade };
    if (section) query.section = section;

    const students = await Student.find(query);
    return res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching students', error: error.message });
  }
};

// Proxy to central attendance controller for marking attendance
exports.markAttendance = async (req, res, next) => {
  return attendanceController.markAttendance(req, res, next);
};

// Get a single student's attendance (proxy to central controller)
exports.getStudentAttendance = async (req, res, next) => {
  return attendanceController.getStudentAttendance(req, res, next);
};

// Today attendance summary for a class using embedded records if present
exports.getTodayAttendance = async (req, res) => {
  try {
    const { grade, section, session } = req.query;
    if (!grade) {
      return res.status(400).json({ success: false, message: 'Class (grade) is required' });
    }
    const today = new Date().toISOString().split('T')[0];
    const query = { grade };
    if (section) query.section = section;

    const students = await Student.find(query);
    const data = students.map(s => {
      const record = (s.attendance || []).find(r => r.date === today && (!session || r.session === session));
      return {
        studentId: s._id,
        name: s.name,
        grade: s.grade,
        section: s.section,
        todayStatus: record ? record.status : 'not_marked',
        markedAt: record ? record.markedAt : null
      };
    });

    return res.status(200).json({ success: true, date: today, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching today attendance', error: error.message });
  }
};

// Teacher management admin endpoints (placeholders to avoid runtime failure)
exports.getAllTeachers = async (_req, res) => {
  return res.status(200).json({ success: true, count: 0, data: [] });
};

exports.createTeacher = async (_req, res) => {
  return res.status(501).json({ success: false, message: 'createTeacher not implemented' });
};

exports.updateTeacher = async (_req, res) => {
  return res.status(501).json({ success: false, message: 'updateTeacher not implemented' });
};

exports.deleteTeacher = async (_req, res) => {
  return res.status(501).json({ success: false, message: 'deleteTeacher not implemented' });
};

exports.resetTeacherPassword = async (_req, res) => {
  return res.status(501).json({ success: false, message: 'resetTeacherPassword not implemented' });
};

exports.getTeacherStatus = async (_req, res) => {
  return res.status(200).json({ success: true, data: { onlineStatus: false } });
};

exports.updateTeacherStatus = async (_req, res) => {
  return res.status(200).json({ success: true, message: 'Status updated' });
};

exports.getMyAssignments = async (_req, res) => {
  return res.status(200).json({ success: true, data: { assignments: [] } });
};

