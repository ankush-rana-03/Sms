const axios = require('axios');

async function testEmailReset() {
  console.log('🔧 Testing Email-Based Password Reset\n');
  
  try {
    // Step 1: Login as teacher
    console.log('🔐 Step 1: Login as teacher...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'reset8@school.com',
      password: 'OHECPDvG$P1O', // Try original password
      role: 'teacher'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed, trying with different password...');
      
      // Try with the password that should have been set
      const loginResponse2 = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'reset8@school.com',
        password: 'newresetpassword123',
        role: 'teacher'
      });

      if (!loginResponse2.data.success) {
        console.log('❌ Both login attempts failed');
        return;
      }

      console.log('✅ Login successful with second attempt');
      var teacherToken = loginResponse2.data.token;
    } else {
      console.log('✅ Login successful');
      var teacherToken = loginResponse.data.token;
    }

    // Step 2: Test forgot password endpoint
    console.log('\n🔄 Step 2: Testing forgot password...');
    const forgotResponse = await axios.post('http://localhost:5000/api/auth/forgotpassword', {
      email: 'reset8@school.com'
    });

    console.log('📧 Forgot Password Response:', JSON.stringify(forgotResponse.data, null, 2));

    if (forgotResponse.data.success) {
      console.log('✅ Forgot password email sent successfully!');
      console.log('📧 Check the email for reset link');
    } else {
      console.log('❌ Forgot password failed:', forgotResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testEmailReset().catch(console.error);