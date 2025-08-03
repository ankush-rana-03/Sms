const axios = require('axios');

// Test teacher creation functionality with authentication
async function testTeacherCreationWithAuth() {
  console.log('=== Testing Teacher Creation Functionality with Authentication ===\n');
  
  const baseURL = 'https://sms-38ap.onrender.com/api';
  let authToken = null;
  
  try {
    // Step 1: Login as admin to get authentication token
    console.log('1. Attempting to login as admin...');
    const loginData = {
      email: "admin@school.com",
      password: "password123",
      role: "admin"
    };
    
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, loginData);
      authToken = loginResponse.data.token;
      console.log('✅ Admin login successful');
      console.log('Token received:', authToken ? 'Yes' : 'No');
    } catch (error) {
      console.log('❌ Admin login failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
      console.log('\nTrying with different admin credentials...');
      
      // Try alternative admin credentials
      const altLoginData = {
        email: "admin@example.com",
        password: "password123",
        role: "admin"
      };
      
      try {
        const altLoginResponse = await axios.post(`${baseURL}/auth/login`, altLoginData);
        authToken = altLoginResponse.data.token;
        console.log('✅ Alternative admin login successful');
      } catch (altError) {
        console.log('❌ Alternative admin login also failed:');
        console.log('Status:', altError.response?.status);
        console.log('Message:', altError.response?.data?.message || altError.message);
        console.log('\n⚠️  Cannot proceed with teacher creation test without authentication');
        return;
      }
    }

    // Step 2: Test teacher listing with authentication
    console.log('\n2. Testing teacher listing with authentication...');
    try {
      const response = await axios.get(`${baseURL}/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Success! Teachers retrieved successfully');
      console.log('Total teachers:', response.data?.total || response.data?.count || 'N/A');
      console.log('Current page teachers:', response.data?.data?.length || 0);
    } catch (error) {
      console.log('❌ Error fetching teachers:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }

    // Step 3: Test teacher creation with authentication
    console.log('\n3. Testing teacher creation with authentication...');
    const teacherData = {
      name: "Test Teacher " + Date.now(),
      email: `test.teacher.${Date.now()}@school.com`,
      phone: "1234567890",
      designation: "TGT",
      subjects: ["Mathematics", "Science"],
      qualification: {
        degree: "B.Ed",
        institution: "Test University",
        yearOfCompletion: 2020
      },
      experience: {
        years: 3,
        previousSchools: ["Previous School 1"]
      },
      joiningDate: "2024-01-01",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "0987654321",
        relationship: "Spouse"
      }
    };

    console.log('Creating teacher with data:', JSON.stringify(teacherData, null, 2));
    
    try {
      const response = await axios.post(`${baseURL}/admin/teachers`, teacherData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success! Teacher created successfully');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      // Step 4: Verify teacher was created by fetching the list again
      console.log('\n4. Verifying teacher creation by fetching updated list...');
      const verifyResponse = await axios.get(`${baseURL}/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Verification successful');
      console.log('Updated total teachers:', verifyResponse.data?.total || verifyResponse.data?.count || 'N/A');
      
    } catch (error) {
      console.log('❌ Error creating teacher:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTeacherCreationWithAuth();