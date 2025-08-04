const axios = require('axios');

// Test that simulates the frontend teacher creation process
async function testFrontendTeacherCreation() {
  console.log('=== Testing Frontend Teacher Creation Process ===\n');
  
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Step 1: Login as admin (simulating frontend login)
    console.log('1. Frontend Login Process...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: "admin@school.com",
      password: "password123",
      role: "admin"
    });
    
    const authToken = loginResponse.data.token;
    console.log('✅ Admin login successful (Frontend would store this token)');
    console.log('User:', loginResponse.data.user.name);
    console.log('Role:', loginResponse.data.user.role);
    
    // Step 2: Fetch existing teachers (simulating frontend loading teacher list)
    console.log('\n2. Loading Teacher List (Frontend would display this)...');
    const teachersResponse = await axios.get(`${baseURL}/admin/teachers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Teacher list loaded successfully');
    console.log('Current teachers count:', teachersResponse.data?.total || 0);
    
    // Step 3: Create teacher with frontend-style data (simulating form submission)
    console.log('\n3. Creating Teacher (Frontend form submission)...');
    
    // This is exactly how the frontend sends data
    const frontendTeacherData = {
      name: "Frontend Test Teacher",
      email: `frontend.test.${Date.now()}@school.com`,
      phone: "9876543210",
      designation: "PGT",
      subjects: "Mathematics, Physics, Chemistry", // Frontend sends as comma-separated string
      qualification: {
        degree: "M.Sc",
        institution: "Frontend University",
        yearOfCompletion: 2022
      },
      experience: {
        years: 5,
        previousSchools: ["Previous School A", "Previous School B"]
      },
      joiningDate: "2024-06-01",
      emergencyContact: {
        name: "Emergency Contact Person",
        phone: "1122334455",
        relationship: "Parent"
      }
    };
    
    console.log('Frontend sending data:', JSON.stringify(frontendTeacherData, null, 2));
    
    try {
      const createResponse = await axios.post(`${baseURL}/admin/teachers`, frontendTeacherData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Teacher created successfully!');
      console.log('Response from backend:', JSON.stringify(createResponse.data, null, 2));
      
      // Step 4: Verify teacher was created (frontend would refresh the list)
      console.log('\n4. Verifying Teacher Creation (Frontend would refresh list)...');
      const updatedTeachersResponse = await axios.get(`${baseURL}/admin/teachers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('✅ Updated teacher list loaded');
      console.log('New teachers count:', updatedTeachersResponse.data?.total || 0);
      
      // Find the created teacher in the list
      const createdTeacher = updatedTeachersResponse.data?.data?.find(
        teacher => teacher.email === frontendTeacherData.email
      );
      
      if (createdTeacher) {
        console.log('✅ Created teacher found in list:');
        console.log('- Name:', createdTeacher.name);
        console.log('- Email:', createdTeacher.email);
        console.log('- Teacher ID:', createdTeacher.teacherId);
        console.log('- Designation:', createdTeacher.designation);
        console.log('- Subjects:', createdTeacher.subjects);
        console.log('- Is Active:', createdTeacher.isActive);
        console.log('- User Account:', createdTeacher.user ? 'Created' : 'Not found');
      } else {
        console.log('❌ Created teacher not found in list');
      }
      
      // Step 5: Test teacher login with generated password
      console.log('\n5. Testing Teacher Login (Teacher would use temporary password)...');
      const teacherLoginData = {
        email: frontendTeacherData.email,
        password: createResponse.data.data.temporaryPassword,
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
    
    // Step 6: Test with different designation
    console.log('\n6. Testing Different Teacher Type...');
    const differentTeacherData = {
      name: "JBT Teacher",
      email: `jbt.teacher.${Date.now()}@school.com`,
      phone: "5555555555",
      designation: "JBT",
      subjects: "English, Hindi",
      qualification: {
        degree: "JBT",
        institution: "JBT College",
        yearOfCompletion: 2021
      },
      experience: {
        years: 2,
        previousSchools: ["Primary School"]
      },
      joiningDate: "2024-07-01"
    };
    
    try {
      const jbtResponse = await axios.post(`${baseURL}/admin/teachers`, differentTeacherData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ JBT Teacher created successfully');
      console.log('Teacher ID:', jbtResponse.data.data.teacher.teacherId);
      console.log('Temporary Password:', jbtResponse.data.data.temporaryPassword);
    } catch (error) {
      console.log('❌ JBT Teacher creation failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the frontend simulation test
testFrontendTeacherCreation();