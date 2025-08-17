const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test 1: Get sessions
    console.log('1. Testing /sessions endpoint...');
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/sessions`);
      console.log('✅ Sessions endpoint working');
      console.log('   Response:', sessionsResponse.data);
    } catch (error) {
      console.log('❌ Sessions endpoint failed:', error.response?.data || error.message);
    }

    // Test 2: Get classes
    console.log('\n2. Testing /classes endpoint...');
    try {
      const classesResponse = await axios.get(`${BASE_URL}/classes`);
      console.log('✅ Classes endpoint working');
      console.log('   Response:', classesResponse.data);
    } catch (error) {
      console.log('❌ Classes endpoint failed:', error.response?.data || error.message);
    }

    // Test 3: Get students
    console.log('\n3. Testing /students endpoint...');
    try {
      const studentsResponse = await axios.get(`${BASE_URL}/students`);
      console.log('✅ Students endpoint working');
      console.log('   Response:', studentsResponse.data);
    } catch (error) {
      console.log('❌ Students endpoint failed:', error.response?.data || error.message);
    }

    // Test 4: Get students by grade and section
    console.log('\n4. Testing /students with grade and section...');
    try {
      const studentsFilteredResponse = await axios.get(`${BASE_URL}/students?grade=nursery&section=A`);
      console.log('✅ Students filtered endpoint working');
      console.log('   Response:', studentsFilteredResponse.data);
    } catch (error) {
      console.log('❌ Students filtered endpoint failed:', error.response?.data || error.message);
    }

    // Test 5: Get attendance
    console.log('\n5. Testing /attendance endpoint...');
    try {
      const attendanceResponse = await axios.get(`${BASE_URL}/attendance/date/2025-08-17`);
      console.log('✅ Attendance endpoint working');
      console.log('   Response:', attendanceResponse.data);
    } catch (error) {
      console.log('❌ Attendance endpoint failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI();