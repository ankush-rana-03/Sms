const axios = require('axios');

// Simple test for teacher login
async function simpleTeacherLoginTest() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🧪 Simple Teacher Login Test\n');

  // Test credentials - replace these with actual credentials from teacher creation
  const testCredentials = {
    email: 'testteacher@school.com', // Replace with actual email
    password: 'your-temp-password-here', // Replace with actual password from teacher creation
    role: 'teacher'
  };

  console.log('📧 Testing with email:', testCredentials.email);
  console.log('🔑 Testing with password:', testCredentials.password);
  console.log('🎭 Testing with role:', testCredentials.role);

  try {
    console.log('\n📤 Sending login request...');
    
    const response = await axios.post(`${baseURL}/auth/login`, testCredentials);
    
    if (response.data.success) {
      console.log('✅ Login successful!');
      console.log('🎫 Token received:', response.data.token ? 'Yes' : 'No');
      console.log('👤 User role:', response.data.user.role);
      console.log('👤 User name:', response.data.user.name);
      console.log('📧 User email:', response.data.user.email);
      console.log('✅ User active:', response.data.user.isActive);
      
      // Test accessing a protected endpoint
      console.log('\n🚪 Testing protected endpoint access...');
      
      try {
        const meResponse = await axios.get(`${baseURL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${response.data.token}`
          }
        });
        
        if (meResponse.data.success) {
          console.log('✅ Can access protected endpoint');
          console.log('👤 Current user:', meResponse.data.data.name);
        }
      } catch (meError) {
        console.log('❌ Error accessing protected endpoint:', meError.response?.data?.message || meError.message);
      }
      
    } else {
      console.log('❌ Login failed:', response.data.message);
    }
    
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 401 Error: Invalid credentials - check email and password');
    } else if (error.response?.status === 403) {
      console.log('💡 403 Error: Access denied - check role or account status');
    } else if (error.response?.status === 400) {
      console.log('💡 400 Error: Bad request - check all required fields');
    }
  }
}

// Instructions for the user
console.log('📋 Instructions:');
console.log('1. Replace the email and password in the testCredentials object');
console.log('2. Use the exact email and temporary password from teacher creation');
console.log('3. Make sure the backend server is running on localhost:5000');
console.log('4. Run this script with: node simple-teacher-login-test.js\n');

// Run the test
simpleTeacherLoginTest().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});