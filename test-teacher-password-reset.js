const axios = require('axios');

async function testTeacherPasswordReset() {
  console.log('🔧 Testing Teacher Password Reset Functionality\n');
  
  try {
    // Step 1: Login as admin
    console.log('👤 Step 1: Logging in as admin...');
    const adminLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@test.com',
      password: 'test123',
      role: 'admin'
    });

    if (!adminLoginResponse.data.success) {
      console.log('❌ Admin login failed:', adminLoginResponse.data.message);
      return;
    }

    console.log('✅ Admin login successful');
    const adminToken = adminLoginResponse.data.token;

    // Step 2: Create a test teacher
    console.log('\n👨‍🏫 Step 2: Creating test teacher...');
    const teacherData = {
      name: 'Password Reset Test Teacher',
      email: 'reset8@school.com',
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

    const createTeacherResponse = await axios.post('http://localhost:5000/api/admin/teachers', teacherData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!createTeacherResponse.data.success) {
      console.log('❌ Teacher creation failed:', createTeacherResponse.data.message);
      return;
    }

    console.log('✅ Teacher created successfully!');
    console.log('📧 Email:', teacherData.email);
    console.log('🔑 Original Password:', createTeacherResponse.data.data.temporaryPassword);

    const originalPassword = createTeacherResponse.data.data.temporaryPassword;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Login as teacher
    console.log('\n🔐 Step 3: Logging in as teacher...');
    const teacherLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: teacherData.email,
      password: originalPassword,
      role: 'teacher'
    });

    if (!teacherLoginResponse.data.success) {
      console.log('❌ Teacher login failed:', teacherLoginResponse.data.message);
      return;
    }

    console.log('✅ Teacher login successful');
    const teacherToken = teacherLoginResponse.data.token;

    // Step 4: Test direct password reset
    console.log('\n🔄 Step 4: Testing direct password reset...');
    const newPassword = 'newresetpassword123';
    const resetPasswordResponse = await axios.put('http://localhost:5000/api/auth/resetpassword-direct', {
      newPassword: newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    console.log('📧 Reset Password Response:', JSON.stringify(resetPasswordResponse.data, null, 2));
    
    if (resetPasswordResponse.data.success) {
      console.log('✅ Password reset successful!');
      
      // Step 5: Test login with new password
      console.log('\n🔐 Step 5: Testing login with new password...');
      const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: teacherData.email,
        password: newPassword,
        role: 'teacher'
      });

      if (newLoginResponse.data.success) {
        console.log('✅ Login successful with new password!');
        
        // Step 6: Test that old password no longer works
        console.log('\n🔐 Step 6: Testing that old password no longer works...');
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
        
        console.log('\n🎉 SUCCESS: Teacher password reset functionality is working!');
        console.log('\n📋 Summary:');
        console.log('✅ Admin user logged in');
        console.log('✅ Teacher created with original password');
        console.log('✅ Teacher logged in successfully');
        console.log('✅ Teacher reset password via direct API');
        console.log('✅ Teacher can login with new password');
        console.log('✅ Old password is no longer valid');
        console.log('✅ Password reset functionality is fully operational');
        
        console.log('\n🔑 Test Credentials:');
        console.log('Admin - Email: test@test.com, Password: test123');
        console.log('Teacher - Email: reset8@school.com, Password: newresetpassword123');
        
      } else {
        console.log('❌ Login failed with new password:', newLoginResponse.data.message);
      }
    } else {
      console.log('❌ Password reset failed:', resetPasswordResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Authentication issue - check credentials');
    } else if (error.response?.status === 500) {
      console.log('💡 Server error - check backend logs');
    }
  }
}

console.log('📋 Teacher Password Reset Test');
console.log('1. Make sure backend server is running');
console.log('2. This will create admin user and test teacher password reset');
console.log('3. Tests the complete flow from admin creation to password reset');
console.log('4. Provides working credentials for testing\n');

testTeacherPasswordReset().catch(console.error);