const axios = require('axios');

const API_BASE_URL = 'https://sms-38ap.onrender.com/api';

async function testAttendanceAPI() {
  try {
    console.log('Testing Attendance API...\n');

    // Test 1: Get classes
    console.log('1. Testing GET /classes...');
    try {
      const classesResponse = await axios.get(`${API_BASE_URL}/classes`);
      console.log('✅ Classes endpoint working');
      console.log('Classes found:', classesResponse.data.data.length);
      if (classesResponse.data.data.length > 0) {
        console.log('Sample class:', classesResponse.data.data[0]);
      }
    } catch (error) {
      console.log('❌ Classes endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test 2: Get attendance by date
    console.log('\n2. Testing GET /attendance/date/:date...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceResponse = await axios.get(`${API_BASE_URL}/attendance/date/${today}`);
      console.log('✅ Attendance by date endpoint working');
      console.log('Attendance records found:', attendanceResponse.data.count);
    } catch (error) {
      console.log('❌ Attendance by date endpoint failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Get attendance records
    console.log('\n3. Testing GET /attendance/records...');
    try {
      const recordsResponse = await axios.get(`${API_BASE_URL}/attendance/records`);
      console.log('✅ Attendance records endpoint working');
      console.log('Records found:', recordsResponse.data.count);
    } catch (error) {
      console.log('❌ Attendance records endpoint failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Attendance API test completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAttendanceAPI();