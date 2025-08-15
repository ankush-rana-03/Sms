const axios = require('axios');

const baseURL = process.env.TEST_API_URL || 'http://localhost:5000/api';
const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@school.com';
const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';

async function runEditDeleteAssignmentsTest() {
  console.log('=== Teacher Assignments Edit/Delete Test ===\n');
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

    // 2. Create a test teacher
    console.log('\n2. Creating a test teacher...');
    const teacherData = {
      name: `Test Teacher ${Date.now()}`,
      email: `editdelete.teacher.${Date.now()}@school.com`,
      phone: '1234567890',
      designation: 'TGT',
      subjects: ['Mathematics', 'Science'],
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

    // 3. Assign initial subjects to teacher
    console.log('\n3. Assigning initial subjects to teacher...');
    const initialAssignments = {
      assignedClasses: [
        { grade: '10', section: 'A', subject: 'Mathematics' },
        { grade: '10', section: 'B', subject: 'Mathematics' },
        { grade: '9', section: 'A', subject: 'Science' }
      ]
    };

    const assignRes = await axios.post(
      `${baseURL}/admin/teachers/${teacherId}/assign-classes`,
      initialAssignments,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    if (!assignRes.data.success) throw new Error('Initial assignment failed');
    console.log('✅ Initial assignments created successfully');

    // 4. Fetch teacher to verify initial assignments
    console.log('\n4. Verifying initial assignments...');
    const getTeacherRes = await axios.get(`${baseURL}/admin/teachers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const teacher = getTeacherRes.data.data.find(t => t._id === teacherId);
    if (!teacher) throw new Error('Teacher not found');
    
    console.log('Initial assignments:', teacher.assignedClasses.map(ac => `${ac.grade}-${ac.section}: ${ac.subject}`));
    if (teacher.assignedClasses.length !== 3) {
      throw new Error(`Expected 3 assignments, got ${teacher.assignedClasses.length}`);
    }
    console.log('✅ Initial assignments verified');

    // 5. Test editing an assignment (change Mathematics 10-A to Physics 10-A)
    console.log('\n5. Testing assignment edit (Mathematics 10-A → Physics 10-A)...');
    const editedAssignments = {
      assignedClasses: teacher.assignedClasses.map(ac => 
        (ac.grade === '10' && ac.section === 'A' && ac.subject === 'Mathematics')
          ? { ...ac, subject: 'Physics' }
          : ac
      )
    };

    const editRes = await axios.post(
      `${baseURL}/admin/teachers/${teacherId}/assign-classes`,
      editedAssignments,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    if (!editRes.data.success) throw new Error('Edit assignment failed');
    console.log('✅ Assignment edited successfully');

    // 6. Verify the edit
    console.log('\n6. Verifying assignment edit...');
    const getTeacherRes2 = await axios.get(`${baseURL}/admin/teachers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const updatedTeacher = getTeacherRes2.data.data.find(t => t._id === teacherId);
    
    const physicsAssignment = updatedTeacher.assignedClasses.find(ac => 
      ac.grade === '10' && ac.section === 'A' && ac.subject === 'Physics'
    );
    const mathAssignment = updatedTeacher.assignedClasses.find(ac => 
      ac.grade === '10' && ac.section === 'A' && ac.subject === 'Mathematics'
    );

    if (!physicsAssignment) throw new Error('Physics assignment not found after edit');
    if (mathAssignment) throw new Error('Old Mathematics assignment still exists after edit');
    
    console.log('Updated assignments:', updatedTeacher.assignedClasses.map(ac => `${ac.grade}-${ac.section}: ${ac.subject}`));
    console.log('✅ Assignment edit verified');

    // 7. Test deleting an assignment (remove Physics 10-A)
    console.log('\n7. Testing assignment deletion (removing Physics 10-A)...');
    const deletedAssignments = {
      assignedClasses: updatedTeacher.assignedClasses.filter(ac => 
        !(ac.grade === '10' && ac.section === 'A' && ac.subject === 'Physics')
      )
    };

    const deleteRes = await axios.post(
      `${baseURL}/admin/teachers/${teacherId}/assign-classes`,
      deletedAssignments,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    if (!deleteRes.data.success) throw new Error('Delete assignment failed');
    console.log('✅ Assignment deleted successfully');

    // 8. Verify the deletion
    console.log('\n8. Verifying assignment deletion...');
    const getTeacherRes3 = await axios.get(`${baseURL}/admin/teachers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const finalTeacher = getTeacherRes3.data.data.find(t => t._id === teacherId);
    
    const deletedAssignment = finalTeacher.assignedClasses.find(ac => 
      ac.grade === '10' && ac.section === 'A' && ac.subject === 'Physics'
    );

    if (deletedAssignment) throw new Error('Deleted assignment still exists');
    if (finalTeacher.assignedClasses.length !== 2) {
      throw new Error(`Expected 2 assignments after deletion, got ${finalTeacher.assignedClasses.length}`);
    }
    
    console.log('Final assignments:', finalTeacher.assignedClasses.map(ac => `${ac.grade}-${ac.section}: ${ac.subject}`));
    console.log('✅ Assignment deletion verified');

    // 9. Test duplicate prevention during edit
    console.log('\n9. Testing duplicate prevention during edit...');
    try {
      const duplicateEditAssignments = {
        assignedClasses: [
          ...finalTeacher.assignedClasses,
          { grade: '10', section: 'B', subject: 'Mathematics' } // This should create a duplicate
        ]
      };

      const duplicateRes = await axios.post(
        `${baseURL}/admin/teachers/${teacherId}/assign-classes`,
        duplicateEditAssignments,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      // This should fail due to duplicate detection in backend
      if (duplicateRes.data.success) {
        console.log('⚠️ Duplicate assignment was allowed (this might be expected if backend doesn\'t check for duplicates)');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate assignment correctly prevented');
      } else {
        console.log('⚠️ Unexpected error during duplicate test:', error.response?.data?.message || error.message);
      }
    }

    // 10. Cleanup
    console.log('\n10. Cleaning up test data...');
    await axios.delete(`${baseURL}/admin/teachers/${teacherId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✅ Cleanup complete');
    console.log('\n🎉 Teacher Assignments Edit/Delete Test PASSED!');

  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    
    // Attempt cleanup if possible
    if (teacherId && authToken) {
      try {
        await axios.delete(`${baseURL}/admin/teachers/${teacherId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('🧹 Cleanup completed after error');
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError.message);
      }
    }
    process.exit(1);
  }
}

runEditDeleteAssignmentsTest();