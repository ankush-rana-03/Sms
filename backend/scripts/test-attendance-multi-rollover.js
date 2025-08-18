const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Session = require('../models/Session');
const ClassModel = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
require('../models/User');
const attendanceController = require('../controllers/attendance');
const { rolloverSession } = require('../controllers/sessionManagement');

function fakeReq(userRole, body = {}, params = {}, query = {}) {
  return { user: { id: '000000000000000000000001', role: userRole, _id: '000000000000000000000001' }, body, params, query };
}
function fakeRes() { return { status(c){this.statusCode=c;return this;}, json(p){this.payload=p;return this;} }; }
function next(err){ if (err) throw err; }

(async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const today = new Date().toISOString().split('T')[0];

  // Create session 2025-2026
  const sA = await Session.create({ name: '2025-2026', academicYear: '2025-2026', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isCurrent: true, promotionCriteria: { minimumAttendance: 0, minimumGrade: 'D', requireAllSubjects: true } });
  // Create class 4 A in session A
  const class4A_2025 = await ClassModel.create({ name: '4', section: 'A', academicYear: '2025-2026', session: '2025-2026' });

  // Create two students in session A
  const s1 = await Student.create({ name:'Alice', email:'a@example.com', phone:'1', address:'x', dateOfBirth:'2016-01-01', grade:'4', section:'A', currentSession:'2025-2026', parentName:'P1', parentPhone:'11' });
  const s2 = await Student.create({ name:'Bob', email:'b@example.com', phone:'2', address:'y', dateOfBirth:'2016-02-01', grade:'4', section:'A', currentSession:'2025-2026', parentName:'P2', parentPhone:'22' });

  // Mark attendance in session A for s1 (present), s2 (absent)
  let req = fakeReq('admin', [
    { studentId: s1._id, status: 'present', date: today, session: '2025-2026' },
    { studentId: s2._id, status: 'absent',  date: today, session: '2025-2026' }
  ]);
  let res = fakeRes();
  await attendanceController.bulkMarkAttendance(req, res, next);
  console.log('Session A mark:', res.payload?.message, 'errors:', res.payload?.errors?.length || 0);

  // Rollover session A to next session
  req = fakeReq('admin', {}, { sessionId: String(sA._id) }, {});
  res = fakeRes();
  await rolloverSession(req, res, next);
  console.log('Rollover:', res.payload?.message, '->', res.payload?.data?.newSession);

  // Create a new student only in new session (2026-2027)
  const s3 = await Student.create({ name:'Cara', email:'c@example.com', phone:'3', address:'z', dateOfBirth:'2016-03-01', grade:'5', section:'A', currentSession: res.payload.data.newSession, parentName:'P3', parentPhone:'33' });

  // Ensure class 5 A exists in new session (will auto-create on mark otherwise)
  const class5A_new = await ClassModel.findOne({ name:'5', section:'A', session: res.payload.data.newSession })
    || await ClassModel.create({ name:'5', section:'A', academicYear: '2026-2027', session: res.payload.data.newSession });

  // Mark attendance in new session for s1, s2, s3
  req = fakeReq('admin', [
    { studentId: s1._id, status: 'present', date: today, session: res.payload.data.newSession },
    { studentId: s2._id, status: 'present', date: today, session: res.payload.data.newSession },
    { studentId: s3._id, status: 'late',    date: today, session: res.payload.data.newSession }
  ]);
  res = fakeRes();
  await attendanceController.bulkMarkAttendance(req, res, next);
  console.log('Session B mark:', res.payload?.message, 'errors:', res.payload?.errors?.length || 0);

  // Fetch previous session by class 4 A
  req = fakeReq('admin', {}, { date: today }, { classId: String(class4A_2025._id), session: '2025-2026' });
  res = fakeRes();
  await attendanceController.getAttendanceByDate(req, res, next);
  console.log('Prev session fetch count:', res.payload?.count);

  // Fetch new session by class 5 A
  req = fakeReq('admin', {}, { date: today }, { classId: String(class5A_new._id), session: res.payload.data.newSession });
  res = fakeRes();
  await attendanceController.getAttendanceByDate(req, res, next);
  console.log('New session fetch count:', res.payload?.count);

  // Ensure s3 has no records in old session
  const oldRecS3 = await Attendance.find({ studentId: s3._id, session: '2025-2026' });
  console.log('S3 old session records:', oldRecS3.length);

  await mongoose.disconnect();
  await mongod.stop();
})().catch(e=>{console.error(e);process.exit(1);});

