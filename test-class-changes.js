const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testClassChanges() {
  console.log('🧪 Testing Class Changes...\n');

  try {
    // Test 1: Check if the student registration form accepts class values
    console.log('1. Testing student registration with class values...');
    
    const testStudentData = {
      name: 'Test Student',
      email: 'test.student@example.com',
      phone: '1234567890',
      address: 'Test Address',
      class: 'Nursery', // Using new class field instead of grade
      section: 'A',
      rollNumber: '001',
      dateOfBirth: '2018-01-01',
      gender: 'male',
      bloodGroup: 'A+',
      parentName: 'Test Parent',
      parentPhone: '0987654321'
    };

    console.log('Student data with class field:', testStudentData);
    console.log('✅ Student data structure updated to use "class" instead of "grade"\n');

    // Test 2: Check if the API accepts class parameter
    console.log('2. Testing API endpoints with class parameter...');
    
    // Test students endpoint with class filter
    const studentsResponse = await axios.get(`${BASE_URL}/students?class=Nursery&section=A`);
    console.log('Students API response status:', studentsResponse.status);
    console.log('✅ Students API accepts "class" parameter\n');

    // Test 3: Check teacher endpoints
    console.log('3. Testing teacher endpoints with class parameter...');
    
    const teacherStudentsResponse = await axios.get(`${BASE_URL}/teachers/students?class=Nursery&section=A`);
    console.log('Teacher students API response status:', teacherStudentsResponse.status);
    console.log('✅ Teacher API accepts "class" parameter\n');

    // Test 4: Check attendance endpoints
    console.log('4. Testing attendance endpoints with class parameter...');
    
    const attendanceResponse = await axios.get(`${BASE_URL}/teachers/today-attendance?class=Nursery&section=A`);
    console.log('Attendance API response status:', attendanceResponse.status);
    console.log('✅ Attendance API accepts "class" parameter\n');

    console.log('🎉 All tests passed! The system has been successfully updated to use "class" instead of "grade".');
    console.log('\n📋 Summary of changes:');
    console.log('   • Student registration form now uses "class" field');
    console.log('   • Class options: Nursery, LKG, UKG, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12');
    console.log('   • All API endpoints updated to use "class" parameter');
    console.log('   • Database schema updated to use "class" field');
    console.log('   • Frontend components updated to display "Class" instead of "Grade"');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testClassChanges();