const axios = require('axios');

// Test the teacher assignments endpoint
async function testTeacherEndpoint() {
  try {
    console.log('=== TESTING TEACHER ASSIGNMENTS ENDPOINT ===');
    
    // First, let's try to login as a teacher to get a token
    console.log('\n1. Attempting to login as a teacher...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'teacher@school.com',
      password: 'password123',
      role: 'teacher'
    });
    
    console.log('Login successful:', loginResponse.data);
    const token = loginResponse.data.token;
    
    // Now test the assignments endpoint
    console.log('\n2. Testing /teachers/my-assignments endpoint...');
    
    const assignmentsResponse = await axios.get('http://localhost:5000/api/teachers/my-assignments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Assignments response:', assignmentsResponse.data);
    
  } catch (error) {
    console.error('Error testing endpoint:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n=== DEBUG INFO ===');
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
  }
}

// Run the test
testTeacherEndpoint();