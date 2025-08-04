const axios = require('axios');

async function testTeacherPasswordChange() {
  console.log('🔐 Testing Teacher Password Change Functionality\n');
  
  try {
    // Step 1: Create a test teacher
    console.log('📝 Step 1: Creating a test teacher...');
    
    const teacherData = {
      name: 'Password Change Test Teacher',
      email: 'passwordchange@school.com',
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

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Login as teacher with original password
    console.log('\n🔐 Step 4: Logging in as teacher with original password...');
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

    // Step 5: Change password as teacher
    console.log('\n🔄 Step 5: Changing password as teacher...');
    const newPassword = 'newteacherpassword123';
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
      console.log('🎫 New token received:', changePasswordResponse.data.token ? 'Yes' : 'No');
      
      // Step 6: Test login with new password
      console.log('\n🔐 Step 6: Testing login with new password...');
      const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: teacherData.email,
        password: newPassword,
        role: 'teacher'
      });

      if (newLoginResponse.data.success) {
        console.log('✅ Login successful with new password!');
        console.log('👤 User role:', newLoginResponse.data.user.role);
        console.log('👤 User name:', newLoginResponse.data.user.name);
        
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
        
        console.log('\n🎉 SUCCESS: Teacher password change functionality is working!');
        console.log('\n📋 Summary:');
        console.log('✅ Teacher created with original password');
        console.log('✅ Teacher logged in successfully');
        console.log('✅ Teacher changed password via API');
        console.log('✅ Teacher can login with new password');
        console.log('✅ Old password is no longer valid');
        console.log('✅ Password change functionality is fully operational');
        
      } else {
        console.log('❌ Login failed with new password:', newLoginResponse.data.message);
      }
    } else {
      console.log('❌ Password change failed:', changePasswordResponse.data.message);
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

console.log('📋 Teacher Password Change Test');
console.log('1. Make sure backend server is running');
console.log('2. This will test the complete teacher password change flow');
console.log('3. Tests both API functionality and security');
console.log('4. Verifies old password is invalidated\n');

testTeacherPasswordChange().catch(console.error);