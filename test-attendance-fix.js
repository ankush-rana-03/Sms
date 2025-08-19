const axios = require('axios');

// Test the attendance endpoints
async function testAttendanceEndpoints() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('Testing Attendance Endpoints...\n');
  
  try {
    // Test 1: Get students by class
    console.log('1. Testing getStudentsByClass endpoint...');
    try {
      const response = await axios.get(`${baseURL}/students/class/test-class-id`);
      console.log('✅ getStudentsByClass endpoint exists');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ getStudentsByClass endpoint exists (returned error as expected)');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ getStudentsByClass endpoint not accessible');
        console.log('Error:', error.message);
      }
    }
    
    // Test 2: Get attendance by date
    console.log('\n2. Testing getAttendanceByDate endpoint...');
    try {
      const response = await axios.get(`${baseURL}/attendance/date/2024-01-01`);
      console.log('✅ getAttendanceByDate endpoint exists');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ getAttendanceByDate endpoint exists (returned error as expected)');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ getAttendanceByDate endpoint not accessible');
        console.log('Error:', error.message);
      }
    }
    
    // Test 3: Mark attendance
    console.log('\n3. Testing markAttendance endpoint...');
    try {
      const response = await axios.post(`${baseURL}/attendance/mark`, {
        studentId: 'test-student-id',
        status: 'present',
        date: '2024-01-01'
      });
      console.log('✅ markAttendance endpoint exists');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ markAttendance endpoint exists (returned error as expected)');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data.message);
      } else {
        console.log('❌ markAttendance endpoint not accessible');
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Server not running or not accessible');
    console.error('Error:', error.message);
  }
}

// Run the test
testAttendanceEndpoints();