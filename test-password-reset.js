const axios = require('axios');

async function testPasswordReset() {
  console.log('🧪 Testing Password Reset Functionality\n');
  
  try {
    // Step 1: Create a test teacher
    console.log('📝 Step 1: Creating a test teacher...');
    
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

    const originalPassword = createResponse.data.data.temporaryPassword;
    const teacherId = createResponse.data.data.teacher._id;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Test login with original password
    console.log('\n🔐 Step 4: Testing login with original password...');
    const originalLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: teacherData.email,
      password: originalPassword,
      role: 'teacher'
    });

    if (originalLoginResponse.data.success) {
      console.log('✅ Original password login successful');
    } else {
      console.log('❌ Original password login failed:', originalLoginResponse.data.message);
    }

    // Step 5: Reset password
    console.log('\n🔄 Step 5: Resetting password...');
    const newPassword = 'newpassword123';
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
    console.log('🔑 New Password:', newPassword);

    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Test login with new password
    console.log('\n🔐 Step 6: Testing login with new password...');
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
      
      console.log('\n🎉 SUCCESS: Password reset functionality is working!');
      console.log('\n📋 Working credentials after reset:');
      console.log('Email:', teacherData.email);
      console.log('Password:', newPassword);
      console.log('Role: teacher');
      
    } else {
      console.log('❌ New password login failed:', newLoginResponse.data.message);
      console.log('💡 This indicates the password reset is not working properly');
    }

    // Step 7: Test that old password no longer works
    console.log('\n🔐 Step 7: Testing that old password no longer works...');
    const oldPasswordResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: teacherData.email,
      password: originalPassword,
      role: 'teacher'
    });

    if (!oldPasswordResponse.data.success) {
      console.log('✅ Old password correctly rejected (expected)');
    } else {
      console.log('❌ Old password still works (this is a security issue)');
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
console.log('2. This script will test the complete password reset flow');
console.log('3. You need valid admin credentials to run this test\n');

testPasswordReset().catch(console.error);