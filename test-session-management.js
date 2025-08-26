const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testSession = {
  name: '2024-25 Session',
  academicYear: '2024-2025',
  startDate: '2024-06-01',
  endDate: '2025-05-31',
  description: 'Academic session 2024-25',
  promotionCriteria: {
    minimumAttendance: 75,
    minimumGrade: 'D',
    requireAllSubjects: true
  }
};

const testClass = {
  name: 'Class 10',
  section: 'A',
  academicYear: '2024-2025',
  roomNumber: '101',
  capacity: 40
};

const testStudent = {
  name: 'John Doe',
  email: 'john.doe@test.com',
  phone: '1234567890',
  address: '123 Test Street',
  dateOfBirth: '2010-01-01',
  grade: '10',
  section: 'A',
  rollNumber: '001',
  gender: 'male',
  bloodGroup: 'A+',
  parentName: 'Jane Doe',
  parentPhone: '0987654321'
};

let authToken = '';
let sessionId = '';
let classId = '';
let studentId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testLogin = async () => {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@school.com',
      password: 'password123',
      role: 'admin'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const testCreateSession = async () => {
  console.log('\n📅 Testing Session Creation...');
  try {
    const response = await makeRequest('POST', '/sessions', testSession);
    sessionId = response._id;
    console.log('✅ Session created:', response.name);
    return true;
  } catch (error) {
    console.error('❌ Session creation failed');
    return false;
  }
};

const testGetCurrentSession = async () => {
  console.log('\n🔍 Testing Get Current Session...');
  try {
    const response = await makeRequest('GET', '/sessions/current');
    console.log('✅ Current session:', response.name);
    return true;
  } catch (error) {
    console.error('❌ Get current session failed');
    return false;
  }
};

const testCreateClass = async () => {
  console.log('\n🏫 Testing Class Creation...');
  try {
    const response = await makeRequest('POST', '/classes', testClass);
    classId = response.data._id;
    console.log('✅ Class created:', response.data.name);
    return true;
  } catch (error) {
    console.error('❌ Class creation failed');
    return false;
  }
};

const testCreateStudent = async () => {
  console.log('\n👨‍🎓 Testing Student Creation...');
  try {
    const response = await makeRequest('POST', '/students', testStudent);
    studentId = response.data._id;
    console.log('✅ Student created:', response.data.name);
    return true;
  } catch (error) {
    console.error('❌ Student creation failed');
    return false;
  }
};

const testGetStudentsBySession = async () => {
  console.log('\n📋 Testing Get Students by Session...');
  try {
    const response = await makeRequest('GET', `/students?session=${testSession.name}`);
    console.log('✅ Students in session:', response.count);
    return true;
  } catch (error) {
    console.error('❌ Get students by session failed');
    return false;
  }
};

const testGetClassesBySession = async () => {
  console.log('\n🏫 Testing Get Classes by Session...');
  try {
    const response = await makeRequest('GET', `/classes?session=${testSession.name}`);
    console.log('✅ Classes in session:', response.data.length);
    return true;
  } catch (error) {
    console.error('❌ Get classes by session failed');
    return false;
  }
};

const testProcessPromotions = async () => {
  console.log('\n📈 Testing Process Promotions...');
  try {
    const response = await makeRequest('POST', `/sessions/${sessionId}/process-promotions`);
    console.log('✅ Promotions processed:', response.totalStudents, 'students');
    return true;
  } catch (error) {
    console.error('❌ Process promotions failed');
    return false;
  }
};

const testGetSessionStatistics = async () => {
  console.log('\n📊 Testing Get Session Statistics...');
  try {
    const response = await makeRequest('GET', `/sessions/${sessionId}/statistics`);
    console.log('✅ Session statistics:', {
      totalStudents: response.totalStudents,
      totalClasses: response.totalClasses,
      promotionBreakdown: response.promotionBreakdown
    });
    return true;
  } catch (error) {
    console.error('❌ Get session statistics failed');
    return false;
  }
};

const testArchiveSession = async () => {
  console.log('\n📦 Testing Archive Session...');
  try {
    const response = await makeRequest('POST', `/sessions/${sessionId}/archive`);
    console.log('✅ Session archived:', response.archivedStudents, 'students,', response.archivedClasses, 'classes');
    return true;
  } catch (error) {
    console.error('❌ Archive session failed');
    return false;
  }
};

const testFreshStart = async () => {
  console.log('\n🔄 Testing Fresh Start...');
  try {
    const response = await makeRequest('POST', `/sessions/${sessionId}/fresh-start`);
    console.log('✅ Fresh start completed:', response.promotedStudents, 'students prepared');
    return true;
  } catch (error) {
    console.error('❌ Fresh start failed');
    return false;
  }
};

const testGetAllSessions = async () => {
  console.log('\n📋 Testing Get All Sessions...');
  try {
    const response = await makeRequest('GET', '/sessions');
    console.log('✅ All sessions:', response.length);
    return true;
  } catch (error) {
    console.error('❌ Get all sessions failed');
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Session Management System Tests...\n');
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Create Session', fn: testCreateSession },
    { name: 'Get Current Session', fn: testGetCurrentSession },
    { name: 'Create Class', fn: testCreateClass },
    { name: 'Create Student', fn: testCreateStudent },
    { name: 'Get Students by Session', fn: testGetStudentsBySession },
    { name: 'Get Classes by Session', fn: testGetClassesBySession },
    { name: 'Process Promotions', fn: testProcessPromotions },
    { name: 'Get Session Statistics', fn: testGetSessionStatistics },
    { name: 'Archive Session', fn: testArchiveSession },
    { name: 'Fresh Start', fn: testFreshStart },
    { name: 'Get All Sessions', fn: testGetAllSessions }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Session management system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
};

// Run the tests
runTests().catch(console.error);