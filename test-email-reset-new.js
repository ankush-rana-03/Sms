const axios = require('axios');

async function testEmailResetNew() {
  console.log('🔧 Testing Email-Based Password Reset with New Teacher\n');
  
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
      name: 'Email Reset Test Teacher',
      email: 'emailreset@school.com',
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

    // Step 3: Test forgot password endpoint
    console.log('\n🔄 Step 3: Testing forgot password...');
    const forgotResponse = await axios.post('http://localhost:5000/api/auth/forgotpassword', {
      email: teacherData.email
    });

    console.log('📧 Forgot Password Response:', JSON.stringify(forgotResponse.data, null, 2));

    if (forgotResponse.data.success) {
      console.log('✅ Forgot password email sent successfully!');
      console.log('📧 Check the email for reset link');
      console.log('📧 Email should be sent to:', teacherData.email);
    } else {
      console.log('❌ Forgot password failed:', forgotResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testEmailResetNew().catch(console.error);