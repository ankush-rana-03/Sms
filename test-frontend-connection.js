const axios = require('axios');

async function testFrontendConnection() {
  console.log('🧪 Testing Frontend-Backend Connection\n');
  
  try {
    // Test 1: Check if backend is accessible
    console.log('🔍 Test 1: Checking backend accessibility...');
    try {
      const response = await axios.get('http://localhost:5000/api/auth/login');
      console.log('✅ Backend is accessible');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Backend is accessible (404 expected for GET on login)');
      } else {
        console.log('❌ Backend not accessible:', error.message);
        return;
      }
    }

    // Test 2: Test environment variable loading
    console.log('\n🔍 Test 2: Testing environment variable...');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    console.log('API URL:', apiUrl);

    // Test 3: Test API endpoint with proper URL
    console.log('\n🔍 Test 3: Testing API endpoint...');
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email: 'test@example.com',
        password: 'test',
        role: 'teacher'
      });
      console.log('❌ Unexpected success (should fail)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ API endpoint working (401 expected for invalid credentials)');
      } else {
        console.log('❌ API endpoint error:', error.response?.status, error.response?.data);
      }
    }

    console.log('\n✅ Frontend-Backend connection test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendConnection().catch(console.error);