const axios = require('axios');

// Detailed test for teacher creation with better error reporting
async function detailedTeacherTest() {
  console.log('=== Detailed Teacher Creation Test ===\n');
  
  const baseURL = 'https://sms-38ap.onrender.com/api';
  
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: "admin@school.com",
      password: "password123",
      role: "admin"
    });
    
    const authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
    
    // Step 2: Test teacher creation with detailed error logging
    console.log('\n2. Testing teacher creation with detailed error logging...');
    const teacherData = {
      name: "Detailed Test Teacher",
      email: `detailed.test.${Date.now()}@school.com`,
      phone: "1234567890",
      designation: "TGT",
      subjects: ["Mathematics"],
      qualification: {
        degree: "B.Ed",
        institution: "Test University",
        yearOfCompletion: 2020
      },
      experience: {
        years: 3,
        previousSchools: ["Previous School"]
      },
      joiningDate: "2024-01-01",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "0987654321",
        relationship: "Spouse"
      }
    };
    
    console.log('Sending data:', JSON.stringify(teacherData, null, 2));
    
    try {
      const response = await axios.post(`${baseURL}/admin/teachers`, teacherData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      console.log('✅ Success! Teacher created successfully');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error creating teacher:');
      console.log('Status:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      console.log('Message:', error.response?.data?.message || error.message);
      console.log('Full Error Response:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response?.data?.error) {
        console.log('Detailed Error:', error.response.data.error);
      }
      
      if (error.response?.data?.errors) {
        console.log('Validation Errors:', error.response.data.errors);
      }
      
      // Log the full error object for debugging
      console.log('\nFull Error Object:');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      if (error.response) {
        console.log('Response headers:', error.response.headers);
      }
    }
    
    // Step 3: Test with minimal data
    console.log('\n3. Testing with minimal data...');
    const minimalData = {
      name: "Minimal Teacher",
      email: `minimal.${Date.now()}@school.com`,
      phone: "1234567890",
      designation: "TGT"
    };
    
    try {
      const response = await axios.post(`${baseURL}/admin/teachers`, minimalData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success! Minimal teacher created');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Minimal teacher creation failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
      console.log('Full Response:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
detailedTeacherTest();