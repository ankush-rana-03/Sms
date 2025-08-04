const axios = require('axios');

const baseURL = 'https://sms-38ap.onrender.com/api';

// Test teacher management API endpoints
async function testTeacherManagementAPI() {
  console.log('=== Testing Teacher Management API ===\n');

  try {
    // Test 1: Get all teachers
    console.log('1. Testing GET /admin/teachers...');
    const teachersResponse = await axios.get(`${baseURL}/admin/teachers`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ GET /admin/teachers - Success');
    console.log(`   Found ${teachersResponse.data.count || 0} teachers\n`);

    // Test 2: Get teacher statistics
    console.log('2. Testing GET /admin/teachers/statistics/overview...');
    const statsResponse = await axios.get(`${baseURL}/admin/teachers/statistics/overview`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ GET /admin/teachers/statistics/overview - Success');
    console.log(`   Total teachers: ${statsResponse.data.data?.totalTeachers || 0}\n`);

    // Test 3: Create a test teacher
    console.log('3. Testing POST /admin/teachers...');
    const testTeacherData = {
      name: 'Test Teacher',
      email: `test.teacher.${Date.now()}@example.com`,
      phone: '1234567890',
      designation: 'TGT',
      subjects: ['Mathematics', 'Science'],
      qualification: {
        degree: 'B.Ed',
        institution: 'Test University',
        yearOfCompletion: 2020
      },
      experience: {
        years: 3,
        previousSchools: ['Test School 1']
      },
      specialization: ['Mathematics'],
      salary: 50000,
      joiningDate: new Date().toISOString(),
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '0987654321',
        relationship: 'Spouse'
      }
    };

    const createResponse = await axios.post(`${baseURL}/admin/teachers`, testTeacherData, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
      }
    });
    console.log('✅ POST /admin/teachers - Success');
    console.log(`   Created teacher: ${createResponse.data.data?.teacher?.name}`);
    console.log(`   Temporary password: ${createResponse.data.data?.temporaryPassword}\n`);

    const createdTeacherId = createResponse.data.data?.teacher?._id;

    if (createdTeacherId) {
      // Test 4: Get login logs for the created teacher
      console.log('4. Testing GET /admin/teachers/{id}/login-logs...');
      const logsResponse = await axios.get(`${baseURL}/admin/teachers/${createdTeacherId}/login-logs`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
        }
      });
      console.log('✅ GET /admin/teachers/{id}/login-logs - Success');
      console.log(`   Found ${logsResponse.data.data?.length || 0} login logs\n`);

      // Test 5: Update the teacher
      console.log('5. Testing PUT /admin/teachers/{id}...');
      const updateData = {
        name: 'Updated Test Teacher',
        experience: {
          years: 4,
          previousSchools: ['Test School 1', 'Test School 2']
        }
      };

      const updateResponse = await axios.put(`${baseURL}/admin/teachers/${createdTeacherId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
        }
      });
      console.log('✅ PUT /admin/teachers/{id} - Success');
      console.log(`   Updated teacher: ${updateResponse.data.data?.name}\n`);

      // Test 6: Reset password
      console.log('6. Testing POST /admin/teachers/{id}/reset-password...');
      const resetResponse = await axios.post(`${baseURL}/admin/teachers/${createdTeacherId}/reset-password`, {
        forceReset: true
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
        }
      });
      console.log('✅ POST /admin/teachers/{id}/reset-password - Success');
      console.log(`   New temporary password: ${resetResponse.data.data?.temporaryPassword}\n`);

      // Test 7: Delete the test teacher
      console.log('7. Testing DELETE /admin/teachers/{id}...');
      const deleteResponse = await axios.delete(`${baseURL}/admin/teachers/${createdTeacherId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test-token'}`
        }
      });
      console.log('✅ DELETE /admin/teachers/{id} - Success');
      console.log(`   Deleted teacher: ${deleteResponse.data.message}\n`);
    }

    console.log('🎉 All Teacher Management API tests passed!');

  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
      console.error(`   Data:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    // If it's an authentication error, provide helpful message
    if (error.response?.status === 401) {
      console.log('\n💡 Note: This test requires a valid authentication token.');
      console.log('   Set the TEST_TOKEN environment variable with a valid admin token.');
    }
  }
}

// Run the test
testTeacherManagementAPI();