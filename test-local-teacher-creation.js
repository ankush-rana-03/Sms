const axios = require('axios');

// Test teacher creation with local server
async function testLocalTeacherCreation() {
  console.log('=== Testing Teacher Creation with Local Server ===\n');
  
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
    console.log('✅ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
    
    // Step 2: Test teacher creation
    console.log('\n2. Testing teacher creation...');
    const teacherData = {
      name: "Local Test Teacher",
      email: `local.test.${Date.now()}@school.com`,
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
        }
      });
      console.log('✅ Success! Teacher created successfully');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      // Step 3: Verify by fetching the teacher list
      console.log('\n3. Verifying teacher creation...');
      const listResponse = await axios.get(`${baseURL}/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      console.log('✅ Teacher list retrieved successfully');
      console.log('Total teachers:', listResponse.data?.total || listResponse.data?.count || 'N/A');
      console.log('Teachers found:', listResponse.data?.data?.length || 0);
      
    } catch (error) {
      console.log('❌ Error creating teacher:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
      console.log('Full Error Response:', JSON.stringify(error.response?.data, null, 2));
    }
    
    // Step 4: Test with minimal data
    console.log('\n4. Testing with minimal data...');
    const minimalData = {
      name: "Minimal Local Teacher",
      email: `minimal.local.${Date.now()}@school.com`,
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
testLocalTeacherCreation();