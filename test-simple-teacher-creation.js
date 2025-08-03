const axios = require('axios');

// Simple test for teacher creation with minimal data
async function testSimpleTeacherCreation() {
  console.log('=== Simple Teacher Creation Test ===\n');
  
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
    
    // Step 2: Test with minimal teacher data
    console.log('\n2. Testing teacher creation with minimal data...');
    const minimalTeacherData = {
      name: "Minimal Test Teacher",
      email: `minimal.test.${Date.now()}@school.com`,
      phone: "1234567890",
      designation: "TGT"
    };
    
    console.log('Sending data:', JSON.stringify(minimalTeacherData, null, 2));
    
    try {
      const response = await axios.post(`${baseURL}/admin/teachers`, minimalTeacherData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success! Teacher created with minimal data');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error creating teacher with minimal data:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
      }
    }
    
    // Step 3: Test with complete teacher data
    console.log('\n3. Testing teacher creation with complete data...');
    const completeTeacherData = {
      name: "Complete Test Teacher",
      email: `complete.test.${Date.now()}@school.com`,
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
    
    console.log('Sending data:', JSON.stringify(completeTeacherData, null, 2));
    
    try {
      const response = await axios.post(`${baseURL}/admin/teachers`, completeTeacherData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success! Teacher created with complete data');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error creating teacher with complete data:');
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
testSimpleTeacherCreation();