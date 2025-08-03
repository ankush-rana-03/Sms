const axios = require('axios');

// Test teacher creation functionality
async function testTeacherCreation() {
  console.log('=== Testing Teacher Creation Functionality ===\n');
  
  const baseURL = 'https://sms-38ap.onrender.com/api';
  
  try {
    // Test data for creating a teacher
    const teacherData = {
      name: "Test Teacher",
      email: "test.teacher@school.com",
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

    console.log('1. Testing teacher creation endpoint...');
    console.log('Endpoint:', `${baseURL}/admin/teachers`);
    console.log('Data:', JSON.stringify(teacherData, null, 2));
    
    // Note: This will fail without authentication, but we can see the endpoint structure
    try {
      const response = await axios.post(`${baseURL}/admin/teachers`, teacherData);
      console.log('✅ Success! Teacher created successfully');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Authentication required (expected for admin endpoint)');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data?.message || 'Unauthorized');
      } else {
        console.log('❌ Error creating teacher:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n2. Testing teacher listing endpoint...');
    try {
      const response = await axios.get(`${baseURL}/admin/teachers`);
      console.log('✅ Success! Teachers retrieved successfully');
      console.log('Total teachers:', response.data?.total || 'N/A');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Authentication required (expected for admin endpoint)');
      } else {
        console.log('❌ Error fetching teachers:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n3. Testing public teacher endpoint...');
    try {
      const response = await axios.get(`${baseURL}/teachers`);
      console.log('✅ Success! Public teachers endpoint working');
      console.log('Response status:', response.status);
    } catch (error) {
      console.log('❌ Error accessing public teachers endpoint:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTeacherCreation();