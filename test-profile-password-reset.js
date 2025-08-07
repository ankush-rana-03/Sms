const axios = require('axios');

async function testProfilePasswordReset() {
  console.log('🧪 Testing Profile Password Reset (Teacher Dashboard)\n');
  
  let teacherToken = null;
  
  try {
    // Step 1: Create a test teacher
    console.log('👨‍🏫 Step 1: Creating test teacher...');
    try {
      const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
        name: 'Profile Test Teacher',
        email: 'profiletest@school.com',
        password: 'teacher123',
        role: 'teacher',
        phone: '1234567890',
        address: 'Test Address'
      });
      
      if (registerResponse.data.success) {
        console.log('✅ Teacher created successfully');
      } else {
        console.log('❌ Teacher creation failed:', registerResponse.data.message);
      }
    } catch (error) {
      console.log('💡 Teacher might already exist, continuing...');
    }

    // Step 2: Login as teacher
    console.log('\n🔐 Step 2: Logging in as teacher...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'profiletest@school.com',
      password: 'teacher123',
      role: 'teacher'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Teacher login successful');
      teacherToken = loginResponse.data.token;
    } else {
      console.log('❌ Teacher login failed:', loginResponse.data.message);
      return;
    }

    // Step 3: Test profile password update
    console.log('\n🔄 Step 3: Testing profile password update...');
    try {
      const updateResponse = await axios.put('http://localhost:5000/api/auth/updatepassword', {
        currentPassword: 'teacher123',
        newPassword: 'newteacherpassword123'
      }, {
        headers: {
          'Authorization': `Bearer ${teacherToken}`
        }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Profile password update successful!');
        console.log('Token received:', updateResponse.data.token ? 'Yes' : 'No');
      } else {
        console.log('❌ Profile password update failed:', updateResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Profile password update error:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

    // Step 4: Test login with new password
    console.log('\n🔐 Step 4: Testing login with new password...');
    try {
      const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'profiletest@school.com',
        password: 'newteacherpassword123',
        role: 'teacher'
      });
      
      if (newLoginResponse.data.success) {
        console.log('✅ Login with new password successful!');
      } else {
        console.log('❌ Login with new password failed:', newLoginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testProfilePasswordReset().catch(console.error);