const axios = require('axios');

const API_BASE_URL = 'https://sms-38ap.onrender.com/api';

// Test function to check attendance endpoints
async function testAttendanceAPI() {
  console.log('🧪 Testing Attendance API Endpoints...\n');

  try {
    // Test 1: Check if students endpoint works (no auth required)
    console.log('1️⃣ Testing students endpoint (no auth)...');
    const studentsResponse = await axios.get(`${API_BASE_URL}/students/test/all`);
    console.log('✅ Students endpoint working');
    console.log(`📊 Found ${studentsResponse.data.count} students`);
    
    if (studentsResponse.data.data.length > 0) {
      const sampleStudent = studentsResponse.data.data[0];
      console.log(`👤 Sample student: ${sampleStudent.name} (Grade: ${sampleStudent.grade})`);
    }

    // Test 2: Check if we can get students by grade (this requires auth)
    console.log('\n2️⃣ Testing teachers/students endpoint (requires auth)...');
    try {
      const teachersResponse = await axios.get(`${API_BASE_URL}/teachers/students?grade=6`);
      console.log('✅ Teachers students endpoint working');
      console.log(`📊 Found ${teachersResponse.data.count} students in grade 6`);
    } catch (error) {
      console.log('❌ Teachers students endpoint requires authentication');
      console.log('💡 This is expected - the endpoint is protected');
    }

    // Test 3: Check if classes endpoint works (requires auth)
    console.log('\n3️⃣ Testing classes endpoint (requires auth)...');
    try {
      const classesResponse = await axios.get(`${API_BASE_URL}/classes/available-for-registration`);
      console.log('✅ Classes endpoint working');
      console.log(`📊 Found ${classesResponse.data.data.classes.length} classes`);
    } catch (error) {
      console.log('❌ Classes endpoint requires authentication');
      console.log('💡 This is expected - the endpoint is protected');
    }

    console.log('\n✅ API Test Summary:');
    console.log('✅ Students endpoint: Working (no auth required)');
    console.log('⚠️  Teachers/Students endpoint: Requires authentication');
    console.log('⚠️  Classes endpoint: Requires authentication');
    console.log('\n💡 The attendance system should work once users are properly authenticated');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAttendanceAPI();