const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  console.log('=== Assign Classes To Teacher - In-Memory Test ===');
  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to in-memory MongoDB');

    // Import models and controller after connecting
    const User = require('../../backend/models/User');
    const Teacher = require('../../backend/models/Teacher');
    const Class = require('../../backend/models/Class');
    const controller = require('../../backend/controllers/teacherManagement');

    // Create a user and teacher
    const user = await User.create({
      name: 'Unit Admin',
      email: 'unit.admin@test.com',
      password: 'Passw0rd!@#',
      role: 'teacher',
      phone: '1234567890',
      address: 'N/A'
    });

    const teacher = await Teacher.create({
      user: user._id,
      name: 'Unit Teacher',
      email: 'unit.teacher@test.com',
      phone: '9999999999',
      designation: 'TGT',
      subjects: []
    });

    // Create a class
    const cls = await Class.create({
      name: 'Class 10',
      section: 'A',
      academicYear: '2024-2025',
      roomNumber: '101',
      capacity: 40
    });

    // Helper to mock res
    const createRes = () => {
      const res = {};
      res.statusCode = 200;
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (data) => { res.data = data; return res; };
      return res;
    };

    // 1) Assign one subject
    const req1 = {
      params: { teacherId: teacher._id.toString() },
      body: {
        assignedClasses: [
          {
            class: cls._id.toString(),
            section: cls.section,
            subject: 'Mathematics',
            grade: '10',
            time: '10:00 AM',
            day: 'Monday'
          }
        ]
      }
    };
    const res1 = createRes();
    await controller.assignClassesToTeacher(req1, res1);

    if (!res1.data?.success) throw new Error('First assignment failed');
    console.log('Step 1 OK - Assigned Mathematics');

    // Verify in DB
    const updatedTeacher1 = await Teacher.findById(teacher._id);
    if ((updatedTeacher1.assignedClasses || []).length !== 1) throw new Error('DB not updated after first assignment');

    // 2) Add another subject for same class-section
    const req2 = {
      params: { teacherId: teacher._id.toString() },
      body: {
        assignedClasses: [
          // must send full set; simulate UI sending both
          { class: cls._id.toString(), section: cls.section, subject: 'Mathematics', grade: '10', time: '10:00 AM', day: 'Monday' },
          { class: cls._id.toString(), section: cls.section, subject: 'Science', grade: '10', time: '11:00 AM', day: 'Tuesday' }
        ]
      }
    };
    const res2 = createRes();
    await controller.assignClassesToTeacher(req2, res2);
    if (!res2.data?.success) throw new Error('Second assignment failed');
    console.log('Step 2 OK - Added Science');

    const updatedTeacher2 = await Teacher.findById(teacher._id);
    if ((updatedTeacher2.assignedClasses || []).length !== 2) throw new Error('DB not updated after second assignment');

    // 3) Remove one by sending only one
    const req3 = {
      params: { teacherId: teacher._id.toString() },
      body: {
        assignedClasses: [
          { class: cls._id.toString(), section: cls.section, subject: 'Science', grade: '10', time: '11:00 AM', day: 'Tuesday' }
        ]
      }
    };
    const res3 = createRes();
    await controller.assignClassesToTeacher(req3, res3);
    if (!res3.data?.success) throw new Error('Third assignment (removal) failed');
    console.log('Step 3 OK - Removed Mathematics');

    const updatedTeacher3 = await Teacher.findById(teacher._id);
    if ((updatedTeacher3.assignedClasses || []).length !== 1) throw new Error('DB not updated after removal');

    console.log('\n✅ All assign-classes tests passed.');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
})();