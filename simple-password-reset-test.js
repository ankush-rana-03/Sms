const axios = require('axios');

async function testPasswordReset() {
  console.log('🧪 Simple Password Reset Test\n');
  
  try {
    // Step 1: Try to login as admin
    console.log('🔐 Step 1: Trying admin login...');
    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });

    if (!adminResponse.data.success) {
      console.log('❌ Admin login failed:', adminResponse.data.message);
      console.log('💡 Creating admin user first...');
      
      // Try to create admin
      const registerResponse = await axios.post('http://localhost:5000/api/auth/register', {
        name: 'Test Admin',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
        phone: '1234567890',
        address: 'Test Address'
      });
      
      if (registerResponse.data.success) {
        console.log('✅ Admin created successfully');
      } else {
        console.log('❌ Admin creation failed:', registerResponse.data.message);
        return;
      }
      
      // Try login again
      const adminLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin'
      });
      
      if (!adminLoginResponse.data.success) {
        console.log('❌ Admin login still failed:', adminLoginResponse.data.message);
        return;
      }
      
      console.log('✅ Admin login successful');
      const adminToken = adminLoginResponse.data.token;
      
      // Step 2: Create a test teacher
      console.log('\n👨‍🏫 Step 2: Creating test teacher...');
      const teacherData = {
        name: 'Password Test Teacher',
        email: 'passwordtest@school.com',
        phone: '1234567890',
        designation: 'TGT',
        subjects: ['Mathematics'],
        qualification: {
          degree: 'B.Tech',
          institution: 'Test University',
          yearOfCompletion: 2020
        },
        experience: {
          years: 2,
          previousSchools: []
        },
        salary: 40000,
        joiningDate: new Date().toISOString(),
        emergencyContact: {
          name: 'Test Contact',
          phone: '0987654321',
          relationship: 'Spouse'
        }
      };
      
      const createResponse = await axios.post('http://localhost:5000/api/admin/teachers', teacherData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (!createResponse.data.success) {
        console.log('❌ Teacher creation failed:', createResponse.data.message);
        return;
      }
      
      console.log('✅ Teacher created successfully!');
      const teacherId = createResponse.data.data.teacher._id;
      const originalPassword = createResponse.data.data.temporaryPassword;
      
      // Step 3: Test password reset
      console.log('\n🔄 Step 3: Testing password reset...');
      const newPassword = 'newpassword123';
      const resetResponse = await axios.post(`http://localhost:5000/api/admin/teachers/${teacherId}/reset-password`, {
        newPassword: newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (resetResponse.data.success) {
        console.log('✅ Password reset successful!');
        console.log('📧 Email sent:', resetResponse.data.data?.emailSent);
        console.log('💬 Message:', resetResponse.data.message);
      } else {
        console.log('❌ Password reset failed:', resetResponse.data.message);
      }
      
    } else {
      console.log('✅ Admin login successful');
      const adminToken = adminResponse.data.token;
      
      // Continue with existing admin...
      console.log('💡 Admin already exists, continuing with password reset test...');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testPasswordReset().catch(console.error);