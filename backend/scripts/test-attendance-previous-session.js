const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Session = require('../models/Session');
const ClassModel = require('../models/Class');
const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const attendanceController = require('../controllers/attendance');

function fakeReq(userRole, body = {}, params = {}, query = {}) {
  return { user: { id: '000000000000000000000001', role: userRole, _id: '000000000000000000000001' }, body, params, query };
}

function fakeRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; this.sent = true; return this; },
  };
}

function next(err) { if (err) throw err; }

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.disconnect().catch(() => {});
  await mongoose.connect(uri);

  console.log('Seeding sessions/classes/student...');

  // Create a minimal admin to satisfy any ref if needed
  await User.create({
    name: 'Admin', email: 'admin@test.com', role: 'admin', password: 'secret123', phone: '1111111111', address: 'HQ'
  });

  // Create previous session "2026" and current session "2027"
  await Session.create({ name: '2026', academicYear: '2026', startDate: new Date(), endDate: new Date(), isCurrent: true });
  await Session.create({ name: '2027', academicYear: '2027', startDate: new Date(), endDate: new Date(), isCurrent: false });

  // Create class 4-A for session 2026 and 2027
  const class2026 = await ClassModel.create({ name: '4', section: 'A', academicYear: '2026', session: '2026' });
  await ClassModel.create({ name: '4', section: 'A', academicYear: '2027', session: '2027' });

  // Create student in 2026 session
  const student = await Student.create({
    name: 'Test Student', email: 'student@test.com', phone: '9999999999', address: 'Addr',
    dateOfBirth: '2016-01-01', grade: '4', section: 'A', currentSession: '2026', parentName: 'P', parentPhone: '8888888888'
  });

  // Mark attendance for today in session 2026 (admin role to allow any date; we'll use today to be safe)
  const today = new Date().toISOString().split('T')[0];
  let req = fakeReq('admin', { studentId: student._id, status: 'present', date: today, session: '2026' });
  let res = fakeRes();
  await attendanceController.markAttendance(req, res, next);
  if (!(res.payload && res.payload.success)) throw new Error('Failed to mark attendance for 2026');

  // Simulate starting new session 2027 and promote student
  await Session.updateOne({ name: '2026' }, { $set: { isCurrent: false } });
  await Session.updateOne({ name: '2027' }, { $set: { isCurrent: true } });
  await Student.updateOne({ _id: student._id }, { $set: { currentSession: '2027' } });

  // Retrieve previous session 2026 attendance by date and classId
  req = fakeReq('teacher', {}, { date: today }, { classId: String(class2026._id), session: '2026' });
  res = fakeRes();
  await attendanceController.getAttendanceByDate(req, res, next);
  console.log('Previous session (2026) retrieval count:', res.payload?.count);

  if (res.payload?.count !== 1) {
    console.error('❌ Expected 1 record for session 2026, got:', res.payload?.count);
    process.exitCode = 1;
  } else {
    console.log('✅ Previous session retrieval works for class 4-A in session 2026');
  }

  await mongoose.disconnect();
  await mongod.stop();
}

main().catch(err => { console.error(err); process.exit(1); });

