const axios = require('axios');

async function debugEmailIssue() {
  console.log('🔍 Debugging Email Issue\n');
  
  try {
    // Step 1: Check if server is running
    console.log('📡 Step 1: Checking server connection...');
    try {
      const healthCheck = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'test@test.com',
        password: 'test',
        role: 'admin'
      });
      console.log('✅ Server is responding');
    } catch (error) {
      if (error.response?.status === 500 && error.response?.data?.message === 'Something went wrong!') {
        console.log('✅ Server is responding (expected error for invalid credentials)');
      } else {
        console.log('❌ Server not responding:', error.message);
        return;
      }
    }

    // Step 2: Try admin login
    console.log('\n🔐 Step 2: Trying admin login...');
    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com',
      password: 'admin123',
      role: 'admin'
    });

    if (!adminResponse.data.success) {
      console.log('❌ Admin login failed:', adminResponse.data.message);
      console.log('💡 Need valid admin credentials to test password reset');
      return;
    }

    console.log('✅ Admin login successful');
    const adminToken = adminResponse.data.token;

    // Step 3: Get existing teachers
    console.log('\n👨‍🏫 Step 3: Getting existing teachers...');
    const teachersResponse = await axios.get('http://localhost:5000/api/admin/teachers', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (!teachersResponse.data.success) {
      console.log('❌ Failed to get teachers:', teachersResponse.data.message);
      return;
    }

    const teachers = teachersResponse.data.data;
    console.log(`✅ Found ${teachers.length} teachers`);

    if (teachers.length === 0) {
      console.log('❌ No teachers found. Creating a test teacher...');
      
      // Create a test teacher
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

      const createResponse = await axios.post('http://localhost:5000/api/admin/teachers', teacherData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!createResponse.data.success) {
        console.log('❌ Teacher creation failed:', createResponse.data.message);
        return;
      }

      console.log('✅ Test teacher created');
      const teacherId = createResponse.data.data.teacher._id;
      
      // Test password reset
      console.log('\n🔄 Step 4: Testing password reset with email...');
      const newPassword = 'debugtest123';
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
        console.log('✅ Password reset successful');
        console.log('📧 Email sent:', resetResponse.data.data.emailSent);
        console.log('📨 Message:', resetResponse.data.message);
        
        // Test login with new password
        console.log('\n🔐 Step 5: Testing login with new password...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: teacherData.email,
          password: newPassword,
          role: 'teacher'
        });

        if (loginResponse.data.success) {
          console.log('✅ Login successful with new password');
        } else {
          console.log('❌ Login failed:', loginResponse.data.message);
        }
      } else {
        console.log('❌ Password reset failed:', resetResponse.data.message);
      }
      
    } else {
      // Use first existing teacher
      const teacher = teachers[0];
      console.log(`✅ Using existing teacher: ${teacher.name} (${teacher.email})`);
      
      // Test password reset
      console.log('\n🔄 Step 4: Testing password reset with email...');
      const newPassword = 'debugtest123';
      const resetResponse = await axios.post(`http://localhost:5000/api/admin/teachers/${teacher._id}/reset-password`, {
        newPassword: newPassword,
        forceReset: false
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log('📧 Reset Response:', JSON.stringify(resetResponse.data, null, 2));
      
      if (resetResponse.data.success) {
        console.log('✅ Password reset successful');
        console.log('📧 Email sent:', resetResponse.data.data.emailSent);
        console.log('📨 Message:', resetResponse.data.message);
        
        // Test login with new password
        console.log('\n🔐 Step 5: Testing login with new password...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: teacher.email,
          password: newPassword,
          role: 'teacher'
        });

        if (loginResponse.data.success) {
          console.log('✅ Login successful with new password');
        } else {
          console.log('❌ Login failed:', loginResponse.data.message);
        }
      } else {
        console.log('❌ Password reset failed:', resetResponse.data.message);
      }
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 500) {
      console.log('💡 Server error - check backend logs for email configuration issues');
    }
  }
}

console.log('📋 Email Debug Instructions:');
console.log('1. Make sure backend server is running');
console.log('2. This script will test the complete password reset flow');
console.log('3. Check the response for email status');
console.log('4. Look for any error messages in the response\n');

debugEmailIssue().catch(console.error);