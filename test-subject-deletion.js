// Test the subject deletion functionality
const axios = require('axios');

const baseURL = 'https://sms-38ap.onrender.com/api';
const adminToken = process.env.ADMIN_TOKEN || 'your-admin-token-here';

async function testSubjectDeletion() {
  console.log('🧪 Testing Subject Deletion Functionality\n');

  try {
    // 1. Get all teachers to find one with assignments
    console.log('1. Fetching teachers...');
    const teachersResponse = await axios.get(`${baseURL}/admin/teachers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!teachersResponse.data.success) {
      console.log('❌ Failed to fetch teachers:', teachersResponse.data.message);
      return;
    }

    const teachers = teachersResponse.data.data;
    console.log(`✅ Found ${teachers.length} teachers`);

    // 2. Find a teacher with assignments
    let teacherWithAssignments = teachers.find(t => 
      t.assignedClasses && t.assignedClasses.length > 0
    );

    if (!teacherWithAssignments) {
      console.log('❌ No teachers found with assignments. Creating a test assignment...');
      
      // Create a test assignment
      const testTeacher = teachers[0];
      if (!testTeacher) {
        console.log('❌ No teachers available for testing');
        return;
      }

      console.log('Creating test assignment for teacher:', testTeacher.name);
      const assignmentResponse = await axios.post(
        `${baseURL}/admin/teachers/${testTeacher._id}/assign-classes`,
        {
          assignedClasses: [{
            class: 'Test Class',
            section: 'A',
            subject: 'Test Subject',
            grade: '10',
            time: '9:00 AM',
            day: 'Monday'
          }]
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      if (assignmentResponse.data.success) {
        console.log('✅ Test assignment created successfully');
        // Refresh teacher data
        const refreshResponse = await axios.get(`${baseURL}/admin/teachers/${testTeacher._id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (refreshResponse.data.success) {
          teacherWithAssignments = refreshResponse.data.data;
        }
      } else {
        console.log('❌ Failed to create test assignment:', assignmentResponse.data.message);
        return;
      }
    }

    if (!teacherWithAssignments || !teacherWithAssignments.assignedClasses || teacherWithAssignments.assignedClasses.length === 0) {
      console.log('❌ Still no assignments available for testing');
      return;
    }

    console.log(`✅ Found teacher with assignments: ${teacherWithAssignments.name}`);
    console.log('Current assignments:', JSON.stringify(teacherWithAssignments.assignedClasses, null, 2));

    // 3. Test deleting a subject assignment
    const assignmentToDelete = teacherWithAssignments.assignedClasses[0];
    console.log('\n3. Testing deletion of subject assignment:', {
      class: assignmentToDelete.class,
      section: assignmentToDelete.section,
      subject: assignmentToDelete.subject
    });

    // Log the exact data being sent
    const deleteData = {
      classId: typeof assignmentToDelete.class === 'string' ? assignmentToDelete.class : assignmentToDelete.class._id,
      section: assignmentToDelete.section,
      subject: assignmentToDelete.subject
    };
    
    console.log('Sending delete request with data:', deleteData);

    const deleteResponse = await axios.delete(
      `${baseURL}/admin/teachers/${teacherWithAssignments._id}/subject-assignment`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: deleteData
      }
    );

    console.log('Delete response status:', deleteResponse.status);
    console.log('Delete response data:', deleteResponse.data);

    if (deleteResponse.data.success) {
      console.log('✅ Subject assignment deleted successfully!');
    } else {
      console.log('❌ Failed to delete subject assignment:', deleteResponse.data.message);
    }

    // 4. Verify the deletion by fetching updated teacher data
    console.log('\n4. Verifying deletion...');
    const verifyResponse = await axios.get(`${baseURL}/admin/teachers/${teacherWithAssignments._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (verifyResponse.data.success) {
      const updatedTeacher = verifyResponse.data.data;
      console.log('Updated teacher assignments:', JSON.stringify(updatedTeacher.assignedClasses, null, 2));
      
      const remainingAssignments = updatedTeacher.assignedClasses.filter(ac => 
        ac.subject === assignmentToDelete.subject &&
        ac.section === assignmentToDelete.section &&
        (typeof ac.class === 'string' ? ac.class : ac.class._id) === (typeof assignmentToDelete.class === 'string' ? assignmentToDelete.class : assignmentToDelete.class._id)
      );

      if (remainingAssignments.length === 0) {
        console.log('✅ Verification successful: Subject assignment was completely removed');
      } else {
        console.log('⚠️  Verification warning: Some assignments still remain', remainingAssignments);
      }
    }

    console.log('\n🎉 Subject deletion test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
if (require.main === module) {
  testSubjectDeletion();
}

module.exports = { testSubjectDeletion };