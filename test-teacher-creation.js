const axios = require('axios');

// Test authentication first
async function testAuthentication() {
  try {
    console.log('🔐 Testing Authentication...');
    
    // Try to login as admin (you'll need to provide valid credentials)
    const loginData = {
      email: "admin@school.com", // Replace with actual admin email
      password: "admin123",      // Replace with actual admin password
      role: "admin"              // Required role parameter
    };

    console.log('📤 Attempting login with:', { email: loginData.email, password: '[HIDDEN]' });

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful! Token received.');
      return token;
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return null;
  }
}

// Test teacher creation with authentication
async function testTeacherCreation(token) {
  try {
    console.log('🚀 Testing Teacher Creation...');
    
    if (!token) {
      console.log('❌ No authentication token available. Skipping teacher creation test.');
      return;
    }
    
    // Test data for teacher creation
    const teacherData = {
      name: "John Doe",
      email: "john.doe@school.com",
      phone: "1234567890",
      designation: "TGT",
      subjects: ["Mathematics", "Physics"],
      qualification: {
        degree: "BSc",
        institution: "Test University",
        yearOfCompletion: 2020
      },
      experience: {
        years: 3,
        previousSchools: ["Previous School 1"]
      },
      joiningDate: "2024-01-15",
      emergencyContact: {
        name: "Jane Doe",
        phone: "0987654321",
        relationship: "Spouse"
      },
      specialization: [],
      salary: 0
    };

    console.log('📤 Sending teacher data:', JSON.stringify(teacherData, null, 2));

    // Test with local backend
    const localResponse = await axios.post('http://localhost:5000/api/admin/teachers', teacherData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Local API Response:', localResponse.data);
    
  } catch (error) {
    console.error('❌ Error creating teacher:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

// Test API connectivity
async function testAPIConnectivity() {
  try {
    console.log('🔍 Testing API Connectivity...');
    
    // Test local backend - try different endpoints
    try {
      const localResponse = await axios.get('http://localhost:5000/api/auth/me');
      console.log('✅ Local backend is running');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Local backend is running (authentication required)');
      } else {
        console.log('❌ Local backend connectivity issue:', error.message);
      }
    }
    
    // Test deployed backend
    try {
      const deployedResponse = await axios.get('https://sms-38ap.onrender.com/api/auth/me');
      console.log('✅ Deployed backend is accessible');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Deployed backend is accessible (authentication required)');
      } else {
        console.log('❌ Deployed backend connectivity issue:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ API connectivity error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting Teacher Creation Tests...\n');
  
  await testAPIConnectivity();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const token = await testAuthentication();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testTeacherCreation(token);
  
  console.log('\n✅ Tests completed!');
}

runTests();