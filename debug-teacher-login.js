const axios = require('axios');

// Debug teacher login step by step
async function debugTeacherLogin() {
  const baseURL = 'http://localhost:5000/api';
  
  console.log('🔍 Debugging Teacher Login...\n');

  try {
    // Step 1: Check if we can connect to the server
    console.log('📡 Step 1: Testing server connection...');
    try {
      const healthCheck = await axios.get(`${baseURL.replace('/api', '')}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server connection failed:', error.message);
      return;
    }

    // Step 2: Try to get a list of teachers to see what's in the database
    console.log('\n📋 Step 2: Checking existing teachers...');
    try {
      const teachersResponse = await axios.get(`${baseURL}/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your-admin-token-here'}`
        }
      });
      
      if (teachersResponse.data.success) {
        console.log(`✅ Found ${teachersResponse.data.data.length} teachers in database`);
        
        if (teachersResponse.data.data.length > 0) {
          const firstTeacher = teachersResponse.data.data[0];
          console.log('📧 First teacher email:', firstTeacher.email);
          console.log('🎭 First teacher role:', firstTeacher.user?.role);
          console.log('✅ First teacher active:', firstTeacher.user?.isActive);
          
          // Step 3: Try to login with the first teacher's credentials
          console.log('\n🔐 Step 3: Testing login with first teacher...');
          
          // We need to get the actual password from teacher creation
          // For now, let's try with a common test password
          const testPasswords = ['password123', '123456', 'teacher123', 'test123'];
          
          for (const testPassword of testPasswords) {
            console.log(`\n🔄 Trying password: ${testPassword}`);
            
            try {
              const loginData = {
                email: firstTeacher.email,
                password: testPassword,
                role: 'teacher'
              };

              console.log('📤 Sending login request:', {
                email: loginData.email,
                password: '***',
                role: loginData.role
              });

              const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
              
              if (loginResponse.data.success) {
                console.log('✅ Login successful with password:', testPassword);
                console.log('🎫 Token received:', loginResponse.data.token ? 'Yes' : 'No');
                console.log('👤 User role:', loginResponse.data.user.role);
                console.log('👤 User name:', loginResponse.data.user.name);
                console.log('📧 User email:', loginResponse.data.user.email);
                console.log('✅ User active:', loginResponse.data.user.isActive);
                break;
              }
            } catch (loginError) {
              console.log('❌ Login failed:', loginError.response?.data?.message || loginError.message);
              
              if (loginError.response?.status === 401) {
                console.log('💡 This means the password is incorrect');
              } else if (loginError.response?.status === 403) {
                console.log('💡 This means there might be a role mismatch or account deactivated');
              }
            }
          }
        } else {
          console.log('❌ No teachers found in database');
          console.log('💡 You need to create a teacher first through Teacher Management');
        }
      }
    } catch (teachersError) {
      console.log('❌ Error fetching teachers:', teachersError.response?.data?.message || teachersError.message);
      
      if (teachersError.response?.status === 401) {
        console.log('💡 You need a valid admin token to fetch teachers');
        console.log('💡 Set ADMIN_TOKEN environment variable with a valid admin token');
      }
    }

    // Step 4: Test creating a new teacher and immediately logging in
    console.log('\n🆕 Step 4: Creating a new test teacher and testing login...');
    
    const testTeacherData = {
      name: 'Debug Test Teacher',
      email: 'debugteacher@test.com',
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

    try {
      const createResponse = await axios.post(`${baseURL}/admin/teachers`, testTeacherData, {
        headers: {
          'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'your-admin-token-here'}`
        }
      });

      if (createResponse.data.success) {
        console.log('✅ Test teacher created successfully!');
        console.log('📧 Email:', testTeacherData.email);
        console.log('🔑 Temporary Password:', createResponse.data.data.temporaryPassword);
        console.log('👤 Teacher ID:', createResponse.data.data.teacher.teacherId);
        console.log('🎭 Role:', createResponse.data.data.teacher.user.role);
        
        const tempPassword = createResponse.data.data.temporaryPassword;
        const teacherEmail = testTeacherData.email;

        // Wait a moment for the database to update
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to login immediately
        console.log('\n🔐 Step 5: Testing immediate login with new teacher...');
        
        const loginData = {
          email: teacherEmail,
          password: tempPassword,
          role: 'teacher'
        };

        console.log('📤 Sending login request:', {
          email: loginData.email,
          password: '***',
          role: loginData.role
        });

        const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
        
        if (loginResponse.data.success) {
          console.log('✅ New teacher login successful!');
          console.log('🎫 Token received:', loginResponse.data.token ? 'Yes' : 'No');
          console.log('👤 User role:', loginResponse.data.user.role);
          console.log('👤 User name:', loginResponse.data.user.name);
          console.log('📧 User email:', loginResponse.data.user.email);
          console.log('✅ User active:', loginResponse.data.user.isActive);
        } else {
          console.log('❌ New teacher login failed:', loginResponse.data.message);
        }

      } else {
        console.log('❌ Test teacher creation failed:', createResponse.data.message);
      }

    } catch (createError) {
      console.log('❌ Error creating test teacher:', createError.response?.data?.message || createError.message);
      
      if (createError.response?.status === 401) {
        console.log('💡 You need a valid admin token to create teachers');
      }
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Run the debug
debugTeacherLogin().then(() => {
  console.log('\n🏁 Debug completed!');
  console.log('\n💡 If login is still failing, check:');
  console.log('1. Server is running on localhost:5000');
  console.log('2. You have a valid admin token set in ADMIN_TOKEN');
  console.log('3. Database is connected and working');
  console.log('4. Email and password are exactly as shown in teacher creation');
}).catch(error => {
  console.error('💥 Debug crashed:', error);
});