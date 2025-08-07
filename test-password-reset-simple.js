const axios = require('axios');

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset API Endpoint\n');
  
  try {
    // Test 1: Check if the endpoint exists
    console.log('🔍 Test 1: Checking if password reset endpoint exists...');
    
    // Try to access the endpoint (this should return 401 if endpoint exists)
    try {
      const response = await axios.post('http://localhost:5000/api/admin/teachers/test-id/reset-password', {
        newPassword: 'testpassword123'
      });
      console.log('✅ Endpoint exists and responded:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint exists (401 Unauthorized expected)');
      } else if (error.response?.status === 404) {
        console.log('❌ Endpoint not found (404)');
        console.log('💡 This might indicate a routing issue');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 2: Check if we can create an admin user
    console.log('\n🔍 Test 2: Testing admin user creation...');
    try {
      const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
        name: 'Test Admin',
        email: 'testadmin@school.com',
        password: 'admin123',
        role: 'admin',
        phone: '1234567890',
        address: 'Test Address'
      });
      
      if (registerResponse.data.success) {
        console.log('✅ Admin user created successfully');
        console.log('Token:', registerResponse.data.token ? 'Received' : 'Not received');
      } else {
        console.log('❌ Admin creation failed:', registerResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Admin creation error:', error.response?.data?.message || error.message);
    }

    // Test 3: Test admin login
    console.log('\n🔍 Test 3: Testing admin login...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'testadmin@school.com',
        password: 'admin123',
        role: 'admin'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Admin login successful');
        const adminToken = loginResponse.data.token;
        
        // Test 4: Test password reset with admin token
        console.log('\n🔍 Test 4: Testing password reset with admin token...');
        try {
          const resetResponse = await axios.post('http://localhost:5000/api/admin/teachers/test-id/reset-password', {
            newPassword: 'newpassword123'
          }, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });
          
          if (resetResponse.data.success) {
            console.log('✅ Password reset endpoint working');
          } else {
            console.log('❌ Password reset failed:', resetResponse.data.message);
          }
        } catch (resetError) {
          if (resetError.response?.status === 404) {
            console.log('❌ Teacher not found (expected for test-id)');
          } else {
            console.log('❌ Password reset error:', resetError.response?.data?.message || resetError.message);
          }
        }
      } else {
        console.log('❌ Admin login failed:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Admin login error:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPasswordReset().catch(console.error);