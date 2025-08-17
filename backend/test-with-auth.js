const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testWithAuth() {
  try {
    console.log('Testing API endpoints with authentication...\n');

    // Step 1: Login to get a token
    console.log('1. Logging in...');
    let token = null;
    
    try {
      console.log('   Logging in with test user...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@school.com',
        password: 'test123',
        role: 'admin'
      });
      
      if (loginResponse.data.success) {
        token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('   Token:', token.substring(0, 20) + '...');
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
        return;
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data || error.message);
      return;
    }

    // Create axios instance with auth header
    const authAxios = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Test protected endpoints
    console.log('\n2. Testing protected endpoints...\n');

    // Test sessions
    console.log('Testing /sessions endpoint...');
    try {
      const sessionsResponse = await authAxios.get('/sessions');
      console.log('✅ Sessions endpoint working');
      console.log('   Response:', sessionsResponse.data);
    } catch (error) {
      console.log('❌ Sessions endpoint failed:', error.response?.data || error.message);
    }

    // Test classes
    console.log('\nTesting /classes endpoint...');
    try {
      const classesResponse = await authAxios.get('/classes');
      console.log('✅ Classes endpoint working');
      console.log('   Response:', classesResponse.data);
    } catch (error) {
      console.log('❌ Classes endpoint failed:', error.response?.data || error.message);
    }

    // Test students
    console.log('\nTesting /students endpoint...');
    try {
      const studentsResponse = await authAxios.get('/students');
      console.log('✅ Students endpoint working');
      console.log('   Response:', studentsResponse.data);
    } catch (error) {
      console.log('❌ Students endpoint failed:', error.response?.data || error.message);
    }

    // Test students by grade and section
    console.log('\nTesting /students with grade and section...');
    try {
      const studentsFilteredResponse = await authAxios.get('/students?grade=nursery&section=A');
      console.log('✅ Students filtered endpoint working');
      console.log('   Response:', studentsFilteredResponse.data);
    } catch (error) {
      console.log('❌ Students filtered endpoint failed:', error.response?.data || error.message);
    }

    // Test attendance
    console.log('\nTesting /attendance endpoint...');
    try {
      const attendanceResponse = await authAxios.get('/attendance/date/2025-08-17');
      console.log('✅ Attendance endpoint working');
      console.log('   Response:', attendanceResponse.data);
    } catch (error) {
      console.log('❌ Attendance endpoint failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testWithAuth();