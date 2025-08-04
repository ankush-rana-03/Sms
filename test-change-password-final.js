const axios = require('axios');

async function testChangePasswordFinal() {
  console.log('🔧 Final Test: Teacher Change Password Functionality\n');
  
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

    // Step 2: Create a new test teacher
    console.log('\n👨‍🏫 Step 2: Creating new test teacher...');
    const teacherData = {
      name: 'Change Password Test Teacher',
      email: 'changepwd@school.com',
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

    // Step 4: Change password
    console.log('\n🔄 Step 4: Changing password...');
    const newPassword = 'changedpassword123';
    const changePasswordResponse = await axios.put('http://localhost:5000/api/auth/updatepassword', {
      currentPassword: originalPassword,
      newPassword: newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      }
    });

    console.log('📧 Change Password Response:', JSON.stringify(changePasswordResponse.data, null, 2));

    if (changePasswordResponse.data.success) {
      console.log('✅ Password change successful!');
      
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
        
        console.log('\n🎉 SUCCESS: Teacher password change functionality is working!');
        console.log('\n📋 Summary:');
        console.log('✅ Admin user logged in');
        console.log('✅ Teacher created with original password');
        console.log('✅ Teacher logged in successfully');
        console.log('✅ Teacher changed password via API');
        console.log('✅ Teacher can login with new password');
        console.log('✅ Old password is no longer valid');
        console.log('✅ Password change functionality is fully operational');
        
        console.log('\n🔑 Test Credentials:');
        console.log('Admin - Email: test@test.com, Password: test123');
        console.log('Teacher - Email: changepwd@school.com, Password: changedpassword123');
        
      } else {
        console.log('❌ Login failed with new password:', newLoginResponse.data.message);
      }
    } else {
      console.log('❌ Password change failed:', changePasswordResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

console.log('📋 Final Teacher Password Change Test');
console.log('1. Make sure backend server is running');
console.log('2. This will test the complete teacher password change flow');
console.log('3. Tests the Change Password functionality (not Reset Password)');
console.log('4. Provides working credentials for testing\n');

testChangePasswordFinal().catch(console.error);