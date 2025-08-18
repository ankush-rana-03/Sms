const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Session = require('../models/Session');
const ClassModel = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
require('../models/User');
const attendanceController = require('../controllers/attendance');

function fakeReq(userRole, body = {}, params = {}, query = {}) {
  return { user: { id: '000000000000000000000001', role: userRole, _id: '000000000000000000000001' }, body, params, query };
}
function fakeRes() { return { status(c){this.statusCode=c;return this;}, json(p){this.payload=p;return this;} }; }
function next(err){ if (err) throw err; }

(async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Seed session 2025-2026
  await Session.create({ name: '2025-2026', academicYear: '2025-2026', startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'), isCurrent: true });
  // Class 4 A in that session
  const cls = await ClassModel.create({ name: '4', section: 'A', academicYear: '2025-2026', session: '2025-2026' });
  // Student
  const student = await Student.create({ name:'Test', email:'t@t.com', phone:'1', address:'x', dateOfBirth:'2016-01-01', grade:'4', section:'A', currentSession:'2025-2026', parentName:'P', parentPhone:'2' });

  // Mark absent as admin on 2025-08-18 via bulk
  const date = '2025-08-18';
  let req = fakeReq('admin', [{ studentId: student._id, status: 'absent', date, remarks: 'test', session: '2025-2026' }]);
  let res = fakeRes();
  await attendanceController.bulkMarkAttendance(req, res, next);
  console.log('Bulk mark response:', res.payload?.message, 'errors:', res.payload?.errors?.length || 0);

  // Retrieve by date and session (like UI refresh)
  req = fakeReq('admin', {}, { date }, { classId: String(cls._id), session: '2025-2026' });
  res = fakeRes();
  await attendanceController.getAttendanceByDate(req, res, next);
  console.log('Fetch count:', res.payload?.count);
  if (res.payload?.data?.[0]) {
    console.log('First status:', res.payload.data[0].status);
  }

  // Direct DB check
  const rec = await Attendance.findOne({ studentId: student._id, session: '2025-2026', date: { $gte: new Date(date), $lt: new Date('2025-08-19') } });
  console.log('DB status:', rec?.status);

  await mongoose.disconnect();
  await mongod.stop();
})().catch(e=>{console.error(e);process.exit(1);});

