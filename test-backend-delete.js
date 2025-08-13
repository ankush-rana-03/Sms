// Simple test for backend delete endpoint
const axios = require('axios');

const baseURL = 'http://localhost:5000/api'; // Change this to your backend URL
const adminToken = process.env.ADMIN_TOKEN || 'your-admin-token-here';

async function testBackendDelete() {
  console.log('🧪 Testing Backend Delete Endpoint\n');

  try {
    // 1. Get all teachers
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
    const teacherWithAssignments = teachers.find(t => 
      t.assignedClasses && t.assignedClasses.length > 0
    );

    if (!teacherWithAssignments) {
      console.log('❌ No teachers found with assignments');
      return;
    }

    console.log(`✅ Found teacher: ${teacherWithAssignments.name}`);
    console.log('Current assignments:', JSON.stringify(teacherWithAssignments.assignedClasses, null, 2));

    // 3. Test the delete endpoint
    const assignmentToDelete = teacherWithAssignments.assignedClasses[0];
    console.log('\n3. Testing deletion of:', {
      class: assignmentToDelete.class,
      section: assignmentToDelete.section,
      subject: assignmentToDelete.subject
    });

    const deleteData = {
      classId: assignmentToDelete.class,
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

    console.log('Delete response:', deleteResponse.data);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testBackendDelete();
}

module.exports = { testBackendDelete };