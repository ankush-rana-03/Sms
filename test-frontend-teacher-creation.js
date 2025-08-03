const axios = require('axios');

// Simulate the frontend API service
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('🌐 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          hasToken: !!token
        });
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('❌ API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  getToken() {
    // Simulate getting token from localStorage
    return process.env.TEST_TOKEN || 'test-token';
  }

  async post(url, data) {
    const response = await this.api.post(url, data);
    return response.data;
  }

  async get(url) {
    const response = await this.api.get(url);
    return response.data;
  }
}

// Simulate the frontend form submission
async function simulateFrontendTeacherCreation() {
  console.log('🎭 Simulating Frontend Teacher Creation...\n');

  const apiService = new ApiService();

  try {
    // Step 1: Simulate form data (exactly like frontend)
    const formData = {
      name: "Test Teacher",
      email: "test.teacher@school.com",
      phone: "9876543210",
      designation: "TGT",
      subjects: "Mathematics, Physics, Chemistry", // Frontend sends as string
      qualification: {
        degree: "MSc",
        institution: "Test University",
        yearOfCompletion: 2022
      },
      experience: {
        years: 5,
        previousSchools: ["Previous School 1", "Previous School 2"]
      },
      joiningDate: "2024-01-15",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "1234567890",
        relationship: "Spouse"
      }
    };

    console.log('📝 Frontend Form Data:', JSON.stringify(formData, null, 2));

    // Step 2: Format data for backend (exactly like frontend handleCreateTeacher)
    const teacherData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      designation: formData.designation,
      subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
      qualification: formData.qualification,
      experience: formData.experience,
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      emergencyContact: formData.emergencyContact,
      specialization: [], // Empty array as default
      salary: 0 // Default salary
    };

    console.log('📤 Formatted Data for Backend:', JSON.stringify(teacherData, null, 2));

    // Step 3: Make API call (exactly like frontend)
    console.log('🚀 Making API call to /admin/teachers...');
    
    const responseData = await apiService.post('/admin/teachers', teacherData);
    
    console.log('🎉 Success! Teacher created:', responseData);
    
    return responseData;

  } catch (error) {
    console.error('💥 Frontend simulation failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    // Show what the frontend would display
    if (error.response?.status === 401) {
      console.log('🔐 Frontend would show: "Authentication required. Please login again."');
    } else if (error.response?.status === 400) {
      console.log('⚠️ Frontend would show validation error:', error.response.data.message);
    } else if (error.response?.status === 500) {
      console.log('💥 Frontend would show: "Error creating teacher"');
    }
    
    throw error;
  }
}

// Test different scenarios
async function testScenarios() {
  console.log('🧪 Testing Different Scenarios...\n');

  // Scenario 1: Without authentication
  console.log('📋 Scenario 1: Without Authentication Token');
  console.log('='.repeat(50));
  try {
    await simulateFrontendTeacherCreation();
  } catch (error) {
    console.log('Expected error for scenario 1\n');
  }

  // Scenario 2: With authentication (if we had a valid token)
  console.log('📋 Scenario 2: With Authentication Token');
  console.log('='.repeat(50));
  console.log('Note: This would require a valid admin token');
  console.log('To test this, you would need to:');
  console.log('1. Login as admin through the frontend');
  console.log('2. Copy the token from localStorage');
  console.log('3. Set TEST_TOKEN environment variable');
  console.log('4. Run this test again\n');

  // Scenario 3: Test with deployed backend
  console.log('📋 Scenario 3: Deployed Backend');
  console.log('='.repeat(50));
  console.log('The frontend is configured to use: https://sms-38ap.onrender.com/api');
  console.log('This is the production backend that the frontend actually uses.\n');
}

// Run the simulation
async function runSimulation() {
  console.log('🎬 Starting Frontend Teacher Creation Simulation...\n');
  
  await simulateFrontendTeacherCreation();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  await testScenarios();
  
  console.log('✅ Simulation completed!');
}

runSimulation();