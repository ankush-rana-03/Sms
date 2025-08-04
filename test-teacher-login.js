const axios = require('axios');

// Test teacher login functionality
async function testTeacherLogin() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Teacher Login Functionality...\n');

  try {
    // Step 1: Create a test teacher
    console.log('📝 Step 1: Creating a test teacher...');
    const teacherData = {
      name: 'Test Teacher',
      email: 'testteacher@school.com',
      phone: '1234567890',
      designation: 'TGT',
      subjects: ['Mathematics', 'Science'],
      qualification: {
        degree: 'B.Tech',
        institution: 'Test University',
        yearOfCompletion: 2020
      },
      experience: {
        years: 3,
        previousSchools: ['Previous School']
      },
      salary: 50000,
      joiningDate: new Date().toISOString(),
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '0987654321',
        relationship: 'Spouse'
      }
    };

    const createResponse = await axios.post(`${baseURL}/admin/teachers`, teacherData, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your-admin-token-here'}`
      }
    });

    if (createResponse.data.success) {
      console.log('✅ Teacher created successfully!');
      console.log('📧 Email:', teacherData.email);
      console.log('🔑 Temporary Password:', createResponse.data.data.temporaryPassword);
      console.log('👤 Teacher ID:', createResponse.data.data.teacher.teacherId);
      console.log('🎭 Role:', createResponse.data.data.teacher.user.role);
      
      const tempPassword = createResponse.data.data.temporaryPassword;
      const teacherEmail = teacherData.email;

      // Step 2: Test teacher login
      console.log('\n🔐 Step 2: Testing teacher login...');
      const loginData = {
        email: teacherEmail,
        password: tempPassword,
        role: 'teacher'
      };

      const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
      
      if (loginResponse.data.success) {
        console.log('✅ Teacher login successful!');
        console.log('🎫 Token received:', loginResponse.data.token ? 'Yes' : 'No');
        console.log('👤 User role:', loginResponse.data.user.role);
        console.log('👤 User name:', loginResponse.data.user.name);
        console.log('📧 User email:', loginResponse.data.user.email);
        console.log('✅ User active:', loginResponse.data.user.isActive);
        
        // Step 3: Test accessing teacher-specific routes
        console.log('\n🚪 Step 3: Testing teacher dashboard access...');
        const teacherToken = loginResponse.data.token;
        
        try {
          const meResponse = await axios.get(`${baseURL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${teacherToken}`
            }
          });
          
          if (meResponse.data.success) {
            console.log('✅ Teacher can access /auth/me endpoint');
            console.log('👤 Current user:', meResponse.data.data.name);
            console.log('🎭 Current role:', meResponse.data.data.role);
          }
        } catch (meError) {
          console.log('❌ Error accessing /auth/me:', meError.response?.data?.message || meError.message);
        }

        // Step 4: Test teacher-specific functionality
        console.log('\n📚 Step 4: Testing teacher-specific features...');
        
        // Test accessing classes (teachers should have access)
        try {
          const classesResponse = await axios.get(`${baseURL}/classes`, {
            headers: {
              'Authorization': `Bearer ${teacherToken}`
            }
          });
          console.log('✅ Teacher can access classes endpoint');
        } catch (classesError) {
          console.log('❌ Error accessing classes:', classesError.response?.data?.message || classesError.message);
        }

        // Test accessing students (teachers should have access)
        try {
          const studentsResponse = await axios.get(`${baseURL}/students`, {
            headers: {
              'Authorization': `Bearer ${teacherToken}`
            }
          });
          console.log('✅ Teacher can access students endpoint');
        } catch (studentsError) {
          console.log('❌ Error accessing students:', studentsError.response?.data?.message || studentsError.message);
        }

        // Test accessing teacher management (teachers should NOT have access)
        try {
          const teacherMgmtResponse = await axios.get(`${baseURL}/admin/teachers`, {
            headers: {
              'Authorization': `Bearer ${teacherToken}`
            }
          });
          console.log('❌ Teacher should NOT have access to teacher management');
        } catch (teacherMgmtError) {
          console.log('✅ Teacher correctly denied access to teacher management');
        }

      } else {
        console.log('❌ Teacher login failed:', loginResponse.data.message);
      }

    } else {
      console.log('❌ Teacher creation failed:', createResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure you have a valid admin token in ADMIN_TOKEN environment variable');
    }
  }
}

// Run the test
testTeacherLogin().then(() => {
  console.log('\n🏁 Test completed!');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});