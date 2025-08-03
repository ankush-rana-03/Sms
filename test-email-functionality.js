const axios = require('axios');

// Test email functionality with teacher creation
async function testEmailFunctionality() {
  console.log('=== Testing Email Functionality with Teacher Creation ===\n');
  
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: "admin@school.com",
      password: "password123",
      role: "admin"
    });
    
    const authToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Step 2: Create teacher with email notification
    console.log('\n2. Creating teacher with email notification...');
    const teacherData = {
      name: "Email Test Teacher",
      email: `email.test.${Date.now()}@gmail.com`, // Use a real email for testing
      phone: "1234567890",
      designation: "TGT",
      subjects: ["Mathematics", "English"],
      qualification: {
        degree: "B.Ed",
        institution: "Test University",
        yearOfCompletion: 2023
      },
      experience: {
        years: 4,
        previousSchools: ["Previous School"]
      },
      joiningDate: "2024-08-01",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "0987654321",
        relationship: "Spouse"
      }
    };
    
    console.log('Creating teacher with data:', JSON.stringify(teacherData, null, 2));
    console.log('Email will be sent to:', teacherData.email);
    
    try {
      const response = await axios.post(`${baseURL}/admin/teachers`, teacherData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Teacher created successfully!');
      console.log('Response message:', response.data.message);
      console.log('Temporary password:', response.data.data.temporaryPassword);
      console.log('Teacher ID:', response.data.data.teacher.teacherId);
      
      // Step 3: Check if email was sent
      console.log('\n3. Email Status:');
      console.log('✅ Welcome email should have been sent to:', teacherData.email);
      console.log('📧 Please check the email inbox for the welcome message');
      console.log('📧 The email should contain:');
      console.log('   - Welcome message');
      console.log('   - Login credentials');
      console.log('   - Temporary password');
      console.log('   - Login link to the system');
      
      // Step 4: Test teacher login with the generated password
      console.log('\n4. Testing teacher login with generated password...');
      const teacherLoginData = {
        email: teacherData.email,
        password: response.data.data.temporaryPassword,
        role: "teacher"
      };
      
      try {
        const teacherLoginResponse = await axios.post(`${baseURL}/auth/login`, teacherLoginData);
        console.log('✅ Teacher login successful with temporary password');
        console.log('Teacher user:', teacherLoginResponse.data.user.name);
        console.log('Teacher role:', teacherLoginResponse.data.user.role);
      } catch (loginError) {
        console.log('❌ Teacher login failed:', loginError.response?.data?.message || loginError.message);
      }
      
    } catch (createError) {
      console.log('❌ Teacher creation failed:');
      console.log('Status:', createError.response?.status);
      console.log('Message:', createError.response?.data?.message || createError.message);
      console.log('Full Error:', JSON.stringify(createError.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the email functionality test
testEmailFunctionality();