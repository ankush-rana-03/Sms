const axios = require('axios');

async function testUpdatePassword() {
  console.log('🔧 Testing Update Password Functionality\n');
  
  try {
    // Step 1: Login as teacher with original password
    console.log('🔐 Step 1: Login with original password...');
    const originalLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'reset8@school.com',
      password: 'OHECPDvG$P1O',
      role: 'teacher'
    });

    if (!originalLoginResponse.data.success) {
      console.log('❌ Original login failed:', originalLoginResponse.data.message);
      return;
    }

    console.log('✅ Original login successful');
    const teacherToken = originalLoginResponse.data.token;

    // Step 2: Update password using existing endpoint
    console.log('\n🔄 Step 2: Updating password...');
    const updateResponse = await axios.put('http://localhost:5000/api/auth/updatepassword', {
      currentPassword: 'OHECPDvG$P1O',
      newPassword: 'updatedpassword123'
    }, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    console.log('📧 Update Response:', JSON.stringify(updateResponse.data, null, 2));

    if (!updateResponse.data.success) {
      console.log('❌ Password update failed:', updateResponse.data.message);
      return;
    }

    console.log('✅ Password update successful');

    // Step 3: Try login with new password
    console.log('\n🔐 Step 3: Login with new password...');
    const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'reset8@school.com',
      password: 'updatedpassword123',
      role: 'teacher'
    });

    console.log('📧 New Login Response:', JSON.stringify(newLoginResponse.data, null, 2));

    if (newLoginResponse.data.success) {
      console.log('✅ Login with new password successful!');
    } else {
      console.log('❌ Login with new password failed:', newLoginResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testUpdatePassword().catch(console.error);