const axios = require('axios');

const baseURL = 'https://sms-38ap.onrender.com/api';

async function testTeacherList() {
  console.log('=== Testing Teacher List API ===\n');

  try {
    // Test 1: Get all teachers without auth (should fail)
    console.log('1. Testing GET /admin/teachers without auth...');
    try {
      const response = await axios.get(`${baseURL}/admin/teachers`);
      console.log('❌ Should have failed without auth');
    } catch (error) {
      console.log('✅ Correctly failed without auth:', error.response?.status);
    }

    // Test 2: Get all teachers with auth
    console.log('\n2. Testing GET /admin/teachers with auth...');
    const authResponse = await axios.get(`${baseURL}/admin/teachers`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    
    console.log('✅ GET /admin/teachers - Success');
    console.log('Response status:', authResponse.status);
    console.log('Response data structure:', Object.keys(authResponse.data));
    console.log('Teachers count:', authResponse.data.count || 0);
    console.log('Total teachers:', authResponse.data.total || 0);
    console.log('Page:', authResponse.data.page || 1);
    console.log('Total pages:', authResponse.data.totalPages || 1);
    
    if (authResponse.data.data && authResponse.data.data.length > 0) {
      console.log('\nFirst teacher sample:');
      const firstTeacher = authResponse.data.data[0];
      console.log('- ID:', firstTeacher._id);
      console.log('- Name:', firstTeacher.name);
      console.log('- Email:', firstTeacher.email);
      console.log('- Designation:', firstTeacher.designation);
      console.log('- Is Active:', firstTeacher.isActive);
      console.log('- User:', firstTeacher.user ? 'Present' : 'Missing');
    } else {
      console.log('\n⚠️  No teachers found in database');
    }

  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Note: This test requires a valid authentication token.');
      console.log('   Set the TEST_TOKEN environment variable with a valid admin token.');
    }
  }
}

// Run the test
testTeacherList();