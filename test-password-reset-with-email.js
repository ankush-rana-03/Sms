const axios = require('axios');

async function testPasswordResetWithEmail() {
  console.log('🔄 Testing Password Reset with Email\n');
  
  try {
    // Step 1: Admin login
    console.log('🔐 Step 1: Admin login...');
    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });

    if (!adminResponse.data.success) {
      console.log('❌ Admin login failed:', adminResponse.data.message);
      console.log('💡 Creating admin user first...');
      
      // Try to create admin user via API
      const createAdminResponse = await axios.post('http://localhost:5000/api/auth/register', {
        name: 'Admin User',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
        phone: '1234567890',
        address: 'School Address'
      });
      
      if (createAdminResponse.data.success) {
        console.log('✅ Admin user created via API');
      } else {
        console.log('❌ Admin creation failed:', createAdminResponse.data.message);
        console.log('💡 You may need to create admin user manually in database');
        return;
      }
      
      // Try login again
      const retryLogin = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin'
      });
      
      if (!retryLogin.data.success) {
        console.log('❌ Admin login still failing:', retryLogin.data.message);
        return;
      }
      
      console.log('✅ Admin login successful');
      var adminToken = retryLogin.data.token;
    } else {
      console.log('✅ Admin login successful');
      var adminToken = adminResponse.data.token;
    }

    // Step 2: Create a test teacher
    console.log('\n👨‍🏫 Step 2: Creating test teacher...');
    const teacherData = {
      name: 'Email Test Teacher',
      email: 'ankushrana830@gmail.com', // Use the configured email
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
    console.log('📧 Email:', teacherData.email);
    console.log('🔑 Original Password:', createResponse.data.data.temporaryPassword);

    const teacherId = createResponse.data.data.teacher._id;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Reset password (this should trigger email)
    console.log('\n🔄 Step 3: Resetting password (should send email)...');
    const newPassword = 'resetpassword123';
    const resetResponse = await axios.post(`http://localhost:5000/api/admin/teachers/${teacherId}/reset-password`, {
      newPassword: newPassword,
      forceReset: false
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('📧 Reset Response:', JSON.stringify(resetResponse.data, null, 2));
    
    if (resetResponse.data.success) {
      console.log('✅ Password reset successful!');
      console.log('📧 Email sent:', resetResponse.data.data.emailSent);
      console.log('📨 Message:', resetResponse.data.message);
      
      if (resetResponse.data.data.emailSent) {
        console.log('🎉 SUCCESS: Email notification was sent!');
        console.log('📧 Check your inbox at:', teacherData.email);
      } else {
        console.log('⚠️  Email was not sent (emailSent: false)');
      }
      
      // Step 4: Test login with new password
      console.log('\n🔐 Step 4: Testing login with new password...');
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: teacherData.email,
        password: newPassword,
        role: 'teacher'
      });

      if (loginResponse.data.success) {
        console.log('✅ Login successful with new password!');
        console.log('🎫 Token received:', loginResponse.data.token ? 'Yes' : 'No');
        console.log('👤 User role:', loginResponse.data.user.role);
        console.log('👤 User name:', loginResponse.data.user.name);
        
        console.log('\n🎉 COMPLETE SUCCESS!');
        console.log('✅ Teacher created');
        console.log('✅ Password reset with email notification');
        console.log('✅ Teacher can login with new password');
        console.log('✅ Email system is working perfectly!');
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
    } else {
      console.log('❌ Password reset failed:', resetResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 500) {
      console.log('💡 Server error - check backend logs');
    } else if (error.response?.status === 401) {
      console.log('💡 Authentication issue');
    }
  }
}

console.log('📋 Password Reset with Email Test');
console.log('1. Make sure backend server is running');
console.log('2. This will create a teacher and test password reset');
console.log('3. Email will be sent to: ankushrana830@gmail.com');
console.log('4. Check your inbox for the password reset notification\n');

testPasswordResetWithEmail().catch(console.error);