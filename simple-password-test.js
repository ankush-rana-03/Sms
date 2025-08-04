const axios = require('axios');

async function simplePasswordTest() {
  console.log('🔧 Simple Password Reset Test\n');
  
  try {
    // Step 1: Login as teacher with original password
    console.log('🔐 Step 1: Login with original password...');
    const originalLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'reset5@school.com',
      password: 'gMAAfSdx!!V7',
      role: 'teacher'
    });

    if (!originalLoginResponse.data.success) {
      console.log('❌ Original login failed:', originalLoginResponse.data.message);
      return;
    }

    console.log('✅ Original login successful');
    const teacherToken = originalLoginResponse.data.token;

    // Step 2: Reset password
    console.log('\n🔄 Step 2: Resetting password...');
    const resetResponse = await axios.put('http://localhost:5000/api/auth/resetpassword-direct', {
      newPassword: 'simplepassword123'
    }, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    console.log('📧 Reset Response:', JSON.stringify(resetResponse.data, null, 2));

    if (!resetResponse.data.success) {
      console.log('❌ Password reset failed:', resetResponse.data.message);
      return;
    }

    console.log('✅ Password reset successful');

    // Step 3: Try login with new password
    console.log('\n🔐 Step 3: Login with new password...');
    const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'reset5@school.com',
      password: 'simplepassword123',
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

simplePasswordTest().catch(console.error);