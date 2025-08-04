const axios = require('axios');

async function testTeacherLogin() {
  console.log('🧪 Final Teacher Login Test\n');
  
  try {
    // Test 1: Check server connection
    console.log('📡 Testing server connection...');
    try {
      await axios.get('http://localhost:5000/api/auth/login');
    } catch (error) {
      if (error.response?.status === 405) {
        console.log('✅ Server is running and responding');
      } else {
        console.log('❌ Server connection issue:', error.message);
        return;
      }
    }

    // Test 2: Try to create a teacher through the API
    console.log('\n👨‍🏫 Creating a test teacher through Teacher Management...');
    
    const teacherData = {
      name: 'Final Test Teacher',
      email: 'finaltest@school.com',
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

    // First, let's try to login as admin
    console.log('\n🔐 Step 1: Trying admin login...');
    const adminCredentials = [
      { email: 'admin@school.com', password: 'admin123' },
      { email: 'ankushrana830@gmail.com', password: 'admin123' },
      { email: 'admin@school.com', password: 'password123' }
    ];

    let adminToken = null;
    let adminLoginSuccess = false;

    for (const cred of adminCredentials) {
      try {
        console.log(`🔄 Trying admin login with: ${cred.email}`);
        const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: cred.email,
          password: cred.password,
          role: 'admin'
        });

        if (adminResponse.data.success) {
          console.log('✅ Admin login successful!');
          adminToken = adminResponse.data.token;
          adminLoginSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Admin login failed with ${cred.email}:`, error.response?.data?.message || error.message);
      }
    }

    if (!adminLoginSuccess) {
      console.log('\n❌ Could not login as admin. Creating teacher manually...');
      
      // Test 3: Try direct teacher login with common credentials
      console.log('\n🔐 Testing direct teacher login...');
      
      const testCredentials = [
        { email: 'teacher@school.com', password: 'teacher123', role: 'teacher' },
        { email: 'testteacher@school.com', password: 'teacher123', role: 'teacher' },
        { email: 'teacher@school.com', password: 'password123', role: 'teacher' },
        { email: 'test@school.com', password: 'test123', role: 'teacher' }
      ];

      for (const cred of testCredentials) {
        try {
          console.log(`🔄 Trying teacher login with: ${cred.email}`);
          const teacherResponse = await axios.post('http://localhost:5000/api/auth/login', cred);
          
          if (teacherResponse.data.success) {
            console.log('✅ Teacher login successful!');
            console.log('🎫 Token received:', teacherResponse.data.token ? 'Yes' : 'No');
            console.log('👤 User role:', teacherResponse.data.user.role);
            console.log('👤 User name:', teacherResponse.data.user.name);
            console.log('📧 User email:', teacherResponse.data.user.email);
            
            console.log('\n🎉 SUCCESS: Teacher authentication is working!');
            console.log('\n📋 Working credentials:');
            console.log('Email:', cred.email);
            console.log('Password:', cred.password);
            console.log('Role: teacher');
            
            return;
          }
        } catch (error) {
          console.log(`❌ Teacher login failed with ${cred.email}:`, error.response?.data?.message || error.message);
        }
      }

      console.log('\n❌ No working teacher credentials found.');
      console.log('\n💡 To fix this issue:');
      console.log('1. Go to Teacher Management in the frontend');
      console.log('2. Create a new teacher');
      console.log('3. Note the email and temporary password');
      console.log('4. Use those credentials to login as teacher');
      
      return;
    }

    // If admin login successful, create teacher
    console.log('\n👨‍🏫 Step 2: Creating test teacher...');
    const createResponse = await axios.post('http://localhost:5000/api/admin/teachers', teacherData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (createResponse.data.success) {
      console.log('✅ Teacher created successfully!');
      console.log('📧 Email:', teacherData.email);
      console.log('🔑 Temporary Password:', createResponse.data.data.temporaryPassword);
      console.log('🎭 Role:', createResponse.data.data.teacher.user.role);

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test teacher login
      console.log('\n🔐 Step 3: Testing teacher login...');
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
        console.log('📧 User email:', teacherLoginResponse.data.user.email);
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

  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

console.log('📋 Instructions:');
console.log('1. Make sure backend server is running on localhost:5000');
console.log('2. This script will test teacher creation and login');
console.log('3. If successful, you will get working credentials\n');

testTeacherLogin().catch(console.error);