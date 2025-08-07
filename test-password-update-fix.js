const axios = require('axios');

async function testPasswordUpdateFix() {
  console.log('🔧 Testing Password Update Fix\n');
  
  const baseURL = 'https://sms-38ap.onrender.com/api';
  
  try {
    // Step 1: Try to login with admin credentials
    console.log('🔐 Step 1: Login as admin...');
    
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('User:', user.name, '(' + user.email + ')');
    
    // Step 2: Test password update
    console.log('\n🔄 Step 2: Testing password update...');
    
    try {
      const updateResponse = await axios.put(`${baseURL}/auth/updatepassword`, {
        currentPassword: 'admin123',
        newPassword: 'admin123new'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Password update successful');
        
        // Step 3: Test login with new password
        console.log('\n🔐 Step 3: Testing login with new password...');
        
        const newLoginResponse = await axios.post(`${baseURL}/auth/login`, {
          email: 'admin@school.com',
          password: 'admin123new',
          role: 'admin'
        });
        
        if (newLoginResponse.data.success) {
          console.log('✅ Login with new password successful');
          
          // Step 4: Reset password back
          console.log('\n🔄 Step 4: Resetting password back to original...');
          
          const resetResponse = await axios.put(`${baseURL}/auth/updatepassword`, {
            currentPassword: 'admin123new',
            newPassword: 'admin123'
          }, {
            headers: {
              'Authorization': `Bearer ${newLoginResponse.data.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (resetResponse.data.success) {
            console.log('✅ Password reset successful');
            console.log('\n🎉 SUCCESS: Password update functionality is working correctly!');
          } else {
            console.log('❌ Password reset failed:', resetResponse.data.message);
          }
        } else {
          console.log('❌ Login with new password failed:', newLoginResponse.data.message);
        }
      } else {
        console.log('❌ Password update failed:', updateResponse.data.message);
      }
    } catch (updateError) {
      console.log('❌ Password update error:');
      console.log('Status:', updateError.response?.status);
      console.log('Message:', updateError.response?.data?.message);
      console.log('Full error:', updateError.response?.data);
    }
    
  } catch (loginError) {
    console.log('❌ Login error:');
    console.log('Status:', loginError.response?.status);
    console.log('Message:', loginError.response?.data?.message);
    console.log('Full error:', loginError.response?.data);
  }
}

testPasswordUpdateFix().catch(console.error);