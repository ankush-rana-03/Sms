const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/admin';

// Test data
const testTeacherId = 'your-test-teacher-id'; // Replace with actual teacher ID
const testAssignmentId = 'your-test-assignment-id'; // Replace with actual assignment ID

async function testAssignmentEndpoints() {
  try {
    console.log('🧪 Testing Teacher Assignment Management Endpoints...\n');

    // Test 1: Update assignment
    console.log('1️⃣ Testing UPDATE assignment endpoint...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/teachers/${testTeacherId}/assignments/${testAssignmentId}`, {
        grade: '10',
        section: 'A',
        subject: 'Mathematics'
      });
      console.log('✅ Update successful:', updateResponse.data.message);
    } catch (error) {
      console.log('❌ Update failed:', error.response?.data?.message || error.message);
    }

    // Test 2: Delete assignment
    console.log('\n2️⃣ Testing DELETE assignment endpoint...');
    try {
      const deleteResponse = await axios.delete(`${BASE_URL}/teachers/${testTeacherId}/assignments/${testAssignmentId}`);
      console.log('✅ Delete successful:', deleteResponse.data.message);
    } catch (error) {
      console.log('❌ Delete failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('⚠️  Please update the testTeacherId and testAssignmentId variables with actual values from your database');
  console.log('⚠️  Make sure your backend server is running on port 5000');
  console.log('⚠️  Make sure you have admin authentication set up\n');
  
  // Uncomment the line below to run tests
  // testAssignmentEndpoints();
}

module.exports = { testAssignmentEndpoints };