const axios = require('axios');

async function testPasswordResetComplete() {
  console.log('🧪 Complete Password Reset Test\n');
  
  let adminToken = null;
  let teacherId = null;
  
  try {
    // Step 1: Create admin user
    console.log('👨‍💼 Step 1: Creating admin user...');
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
      } else {
        console.log('❌ Admin creation failed:', registerResponse.data.message);
      }
    } catch (error) {
      console.log('💡 Admin might already exist, continuing...');
    }

    // Step 2: Login as admin
    console.log('\n🔐 Step 2: Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testadmin@school.com',
      password: 'admin123',
      role: 'admin'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful');
      adminToken = loginResponse.data.token;
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.message);
      return;
    }

    // Step 3: Create a test teacher
    console.log('\n👨‍🏫 Step 3: Creating test teacher...');
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
    
    if (createResponse.data.success) {
      console.log('✅ Teacher created successfully!');
      teacherId = createResponse.data.data.teacher._id;
      console.log('📧 Email:', teacherData.email);
      console.log('🔑 Original Password:', createResponse.data.data.temporaryPassword);
    } else {
      console.log('❌ Teacher creation failed:', createResponse.data.message);
      return;
    }

    // Step 4: Test password reset
    console.log('\n🔄 Step 4: Testing password reset...');
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
      console.log('🔑 New password:', resetResponse.data.data?.temporaryPassword);
    } else {
      console.log('❌ Password reset failed:', resetResponse.data.message);
    }

    // Step 5: Test login with new password
    console.log('\n🔐 Step 5: Testing login with new password...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: teacherData.email,
        password: newPassword,
        role: 'teacher'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login with new password successful!');
      } else {
        console.log('❌ Login with new password failed:', loginResponse.data.message);
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

testPasswordResetComplete().catch(console.error);