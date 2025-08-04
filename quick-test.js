const axios = require('axios');

async function quickTest() {
  console.log('🔍 Quick Teacher Login Test\n');
  
  try {
    // Test 1: Check if server is responding
    console.log('📡 Testing server connection...');
    const healthResponse = await axios.get('http://localhost:5000/api/auth/login');
    console.log('✅ Server is responding to auth endpoint');
  } catch (error) {
    if (error.response?.status === 405) {
      console.log('✅ Server is running (405 is expected for GET on login endpoint)');
    } else {
      console.log('❌ Server connection issue:', error.message);
      return;
    }
  }

  // Test 2: Try to create a test teacher
  console.log('\n📝 Creating a test teacher...');
  
  const teacherData = {
    name: 'Test Teacher Login',
    email: 'testlogin@school.com',
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
    // First, let's try to login as admin to get a token
    console.log('\n🔐 Trying to login as admin first...');
    const adminLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@school.com', // Replace with your admin email
      password: 'admin123',      // Replace with your admin password
      role: 'admin'
    });

    if (adminLoginResponse.data.success) {
      console.log('✅ Admin login successful');
      const adminToken = adminLoginResponse.data.token;

      // Now create teacher
      console.log('\n👨‍🏫 Creating test teacher...');
      const createResponse = await axios.post('http://localhost:5000/api/admin/teachers', teacherData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (createResponse.data.success) {
        console.log('✅ Teacher created successfully!');
        console.log('📧 Email:', teacherData.email);
        console.log('🔑 Password:', createResponse.data.data.temporaryPassword);
        console.log('🎭 Role:', createResponse.data.data.teacher.user.role);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test teacher login
        console.log('\n🔐 Testing teacher login...');
        const teacherLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: teacherData.email,
          password: createResponse.data.data.temporaryPassword,
          role: 'teacher'
        });

        if (teacherLoginResponse.data.success) {
          console.log('✅ Teacher login successful!');
          console.log('🎫 Token received:', teacherLoginResponse.data.token ? 'Yes' : 'No');
          console.log('👤 User role:', teacherLoginResponse.data.user.role);
          console.log('👤 User name:', teacherLoginResponse.data.user.name);
          console.log('✅ User active:', teacherLoginResponse.data.user.isActive);
          
          console.log('\n🎉 SUCCESS: Teacher authentication is working!');
          console.log('\n📋 To login in the frontend:');
          console.log('1. Go to Login page');
          console.log('2. Select "Teacher" role');
          console.log('3. Email:', teacherData.email);
          console.log('4. Password:', createResponse.data.data.temporaryPassword);
          
        } else {
          console.log('❌ Teacher login failed:', teacherLoginResponse.data.message);
        }

      } else {
        console.log('❌ Teacher creation failed:', createResponse.data.message);
      }

    } else {
      console.log('❌ Admin login failed:', adminLoginResponse.data.message);
      console.log('\n💡 You need to provide valid admin credentials to test teacher creation');
    }

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Admin credentials needed. Please provide:');
      console.log('1. Your admin email');
      console.log('2. Your admin password');
      console.log('3. Update the script with these credentials');
    }
  }
}

console.log('📋 Instructions:');
console.log('1. Make sure backend server is running on localhost:5000');
console.log('2. Update admin credentials in the script if needed');
console.log('3. Run: node quick-test.js\n');

quickTest().catch(console.error);