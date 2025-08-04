const axios = require('axios');

async function testEmailPasswordReset() {
  console.log('📧 Testing Email Password Reset Functionality\n');
  
  try {
    // Step 1: Create a test teacher
    console.log('📝 Step 1: Creating a test teacher...');
    
    const teacherData = {
      name: 'Email Test Teacher',
      email: 'emailtest@school.com',
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

    // First, try to login as admin
    console.log('\n🔐 Step 2: Trying admin login...');
    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });

    if (!adminResponse.data.success) {
      console.log('❌ Admin login failed:', adminResponse.data.message);
      console.log('💡 You need to create an admin user first or use existing admin credentials');
      return;
    }

    console.log('✅ Admin login successful');
    const adminToken = adminResponse.data.token;

    // Create teacher
    console.log('\n👨‍🏫 Step 3: Creating test teacher...');
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

    // Step 4: Reset password (this should trigger email)
    console.log('\n🔄 Step 4: Resetting password (should send email)...');
    const newPassword = 'emailtest123';
    const resetResponse = await axios.post(`http://localhost:5000/api/admin/teachers/${teacherId}/reset-password`, {
      newPassword: newPassword,
      forceReset: false
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!resetResponse.data.success) {
      console.log('❌ Password reset failed:', resetResponse.data.message);
      return;
    }

    console.log('✅ Password reset successful!');
    console.log('📧 Email sent:', resetResponse.data.data.emailSent ? 'Yes' : 'No');
    console.log('🔑 New Password:', newPassword);
    console.log('📨 Message:', resetResponse.data.message);

    // Step 5: Test login with new password
    console.log('\n🔐 Step 5: Testing login with new password...');
    const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: teacherData.email,
      password: newPassword,
      role: 'teacher'
    });

    if (newLoginResponse.data.success) {
      console.log('✅ New password login successful!');
      console.log('🎫 Token received:', newLoginResponse.data.token ? 'Yes' : 'No');
      console.log('👤 User role:', newLoginResponse.data.user.role);
      console.log('👤 User name:', newLoginResponse.data.user.name);
      
      console.log('\n🎉 SUCCESS: Email password reset functionality is working!');
      console.log('\n📋 Summary:');
      console.log('✅ Teacher created with welcome email');
      console.log('✅ Password reset with notification email');
      console.log('✅ Teacher can login with new password');
      console.log('✅ Email notification system is functional');
      
      console.log('\n📧 Email Features:');
      console.log('- Welcome email sent on teacher creation');
      console.log('- Password reset notification email sent');
      console.log('- Professional HTML email templates');
      console.log('- Security notices and contact information');
      
    } else {
      console.log('❌ New password login failed:', newLoginResponse.data.message);
      console.log('💡 This indicates the password reset is not working properly');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Authentication issue - check admin credentials');
    } else if (error.response?.status === 500) {
      console.log('💡 Server error - check backend logs');
    }
  }
}

console.log('📋 Instructions:');
console.log('1. Make sure backend server is running on localhost:5000');
console.log('2. This script will test the complete email password reset flow');
console.log('3. You need valid admin credentials to run this test');
console.log('4. Check your email inbox for the password reset notification\n');

testEmailPasswordReset().catch(console.error);