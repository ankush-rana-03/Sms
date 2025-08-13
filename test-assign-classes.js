const axios = require('axios');

const baseURL = process.env.TEST_API_URL || 'http://localhost:5000/api';
const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@school.com';
const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';

async function runAssignClassesTest() {
  console.log('=== Assign Classes Integration Test ===\n');
  let authToken = null;
  let teacherId = null;
  let classId = null;
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    authToken = loginRes.data.token;
    if (!authToken) throw new Error('No token received');
    console.log('✅ Admin login successful');

    // 2. Create a class
    console.log('\n2. Creating a test class...');
    const classData = {
      name: `TestClass${Date.now()}`,
      section: 'A',
      academicYear: '2024-2025',
      roomNumber: '101',
      capacity: 40,
    };
    const classRes = await axios.post(`${baseURL}/classes`, classData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    classId = classRes.data.data?._id || classRes.data.data?.class?._id;
    if (!classId) throw new Error('Class creation failed');
    console.log('✅ Class created:', classId);

    // 3. Create a teacher
    console.log('\n3. Creating a test teacher...');
    const teacherData = {
      name: `Test Teacher ${Date.now()}`,
      email: `assignclass.teacher.${Date.now()}@school.com`,
      phone: '1234567890',
      designation: 'TGT',
      subjects: ['Mathematics'],
      qualification: { degree: 'B.Ed', institution: 'Test University', yearOfCompletion: 2020 },
      experience: { years: 2, previousSchools: ['Test School'] },
      joiningDate: '2024-01-01',
      emergencyContact: { name: 'EC', phone: '9999999999', relationship: 'Spouse' },
    };
    const teacherRes = await axios.post(`${baseURL}/admin/teachers`, teacherData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    teacherId = teacherRes.data.data?.teacher?._id || teacherRes.data.data?._id;
    if (!teacherId) throw new Error('Teacher creation failed');
    console.log('✅ Teacher created:', teacherId);

    // 4. Assign class/subject to teacher
    console.log('\n4. Assigning class/subject to teacher...');
    const assignmentPayload = {
      assignedClasses: [
        {
          class: classId,
          section: 'A',
          subject: 'Mathematics',
          grade: '10',
          time: '10:00 AM',
          day: 'Monday',
        },
      ],
    };
    const assignRes = await axios.post(
      `${baseURL}/admin/teachers/${teacherId}/assign-classes`,
      assignmentPayload,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✅ Assignment response:', assignRes.data.message);
    if (!assignRes.data.success) throw new Error('Assignment failed');

    // 4b. Try to assign another subject at the same day/time to trigger conflict
    console.log('\n4b. Assigning conflicting subject (should fail)...');
    try {
      const conflictPayload = {
        assignedClasses: [
          {
            class: classId,
            section: 'A',
            subject: 'Physics',
            grade: '10',
            time: '10:00 AM',
            day: 'Monday',
          },
        ],
      };
      await axios.post(
        `${baseURL}/admin/teachers/${teacherId}/assign-classes`,
        conflictPayload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      throw new Error('Conflict test did not fail as expected');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (!/Time is already assigned/i.test(msg)) {
        console.error('❌ Unexpected error message for conflict:', err.response?.data || err.message);
        throw new Error('Expected conflict error message not received');
      }
      console.log('✅ Conflict prevented with proper message:', msg);
    }

    // 5. Verify assignment in DB
    console.log('\n5. Verifying assignment in DB...');
    const getTeacherRes = await axios.get(`${baseURL}/admin/teachers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const found = getTeacherRes.data.data.find(t => t._id === teacherId);
    if (!found) throw new Error('Teacher not found after assignment');
    const assigned = found.assignedClasses.find(
      ac => ac.class && (ac.class._id === classId || ac.class === classId) && ac.subject === 'Mathematics'
    );
    if (assigned) {
      console.log('✅ Assignment verified in DB:', assigned);
    } else {
      throw new Error('Assignment not found in DB');
    }

    // 6. Cleanup
    console.log('\n6. Cleaning up test data...');
    await axios.delete(`${baseURL}/admin/teachers/${teacherId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    await axios.delete(`${baseURL}/classes/${classId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✅ Cleanup complete');
    console.log('\n🎉 Assign Classes Integration Test PASSED!');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    // Attempt cleanup if possible
    if (teacherId && authToken) {
      try { await axios.delete(`${baseURL}/admin/teachers/${teacherId}`, { headers: { Authorization: `Bearer ${authToken}` } }); } catch {}
    }
    if (classId && authToken) {
      try { await axios.delete(`${baseURL}/classes/${classId}`, { headers: { Authorization: `Bearer ${authToken}` } }); } catch {}
    }
    process.exit(1);
  }
}

runAssignClassesTest();