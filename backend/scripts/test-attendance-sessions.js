const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
// Models (direct controller invocation; no Express app needed)
const Session = require('../models/Session');
const ClassModel = require('../models/Class');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.disconnect().catch(() => {});
  await mongoose.connect(uri);

  // No HTTP layer; calling controllers directly

  console.log('Seeding data...');
  // Create sessions
  const session2025 = await Session.create({
    name: '2025-2026',
    academicYear: '2025-2026',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2026-03-31'),
    isCurrent: true,
  });
  const session2024 = await Session.create({
    name: '2024-2025',
    academicYear: '2024-2025',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31'),
    isCurrent: false,
    status: 'completed',
  });

  // Create admin user
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    role: 'admin',
    password: 'secret123',
    phone: '1111111111',
    address: 'HQ',
  });

  // Create class for both sessions
  const class2024 = await ClassModel.create({ name: '10', section: 'A', academicYear: '2024-2025', session: '2024-2025' });
  const class2025 = await ClassModel.create({ name: '10', section: 'A', academicYear: '2025-2026', session: '2025-2026' });

  // Create student
  const student = await Student.create({
    name: 'John Doe',
    email: 'john@test.com',
    phone: '1234567890',
    address: 'Addr',
    dateOfBirth: '2010-01-01',
    grade: '10',
    section: 'A',
    currentSession: '2024-2025',
    parentName: 'Parent',
    parentPhone: '9999999999',
  });

  // Fake auth middleware bypass: directly hit controller through model isn't trivial here.
  // We'll call controllers directly for precision.
  const attendanceController = require('../controllers/attendance');

  function fakeReq(userRole, body = {}, params = {}, query = {}) {
    return { user: { id: admin._id, role: userRole, _id: admin._id }, body, params, query };
  }

  function fakeRes() {
    return {
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = payload; this.sent = true; return this; },
    };
  }

  function next(err) { if (err) throw err; }

  // Mark attendance in 2024-2025 (admin to allow past date)
  let req = fakeReq('admin', { studentId: student._id, status: 'present', date: '2025-03-15', session: '2024-2025' });
  let res = fakeRes();
  await attendanceController.markAttendance(req, res, next);

  // Promote student to 2025-2026 (simulate)
  await Student.updateOne({ _id: student._id }, { $set: { currentSession: '2025-2026' } });

  // Mark attendance in 2025-2026 (admin to allow non-today date)
  req = fakeReq('admin', { studentId: student._id, status: 'absent', date: '2025-04-10', session: '2025-2026' });
  res = fakeRes();
  await attendanceController.markAttendance(req, res, next);

  // Verify records by session
  const count2024 = await Attendance.countDocuments({ studentId: student._id, session: '2024-2025' });
  const count2025 = await Attendance.countDocuments({ studentId: student._id, session: '2025-2026' });
  console.log('Attendance counts by session => 2024-2025:', count2024, ' | 2025-2026:', count2025);

  // Retrieve by date with session filter (2024-2025)
  req = fakeReq('teacher', {}, { date: '2025-03-15' }, { session: '2024-2025' });
  res = fakeRes();
  await attendanceController.getAttendanceByDate(req, res, next);
  console.log('Retrieve 2024-2025 by date =>', res.payload.count);

  // Retrieve by date with session filter (2025-2026)
  req = fakeReq('teacher', {}, { date: '2025-04-10' }, { session: '2025-2026' });
  res = fakeRes();
  await attendanceController.getAttendanceByDate(req, res, next);
  console.log('Retrieve 2025-2026 by date =>', res.payload.count);

  if (count2024 === 1 && count2025 === 1) {
    console.log('\n✅ Session-wise attendance marking and retrieval: OK');
  } else {
    console.log('\n❌ Session-wise attendance test failed');
    process.exitCode = 1;
  }

  await mongoose.disconnect();
  await mongod.stop();
}

main().catch(err => { console.error(err); process.exit(1); });

