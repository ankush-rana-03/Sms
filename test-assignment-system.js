const axios = require('axios');
const mongoose = require('mongoose');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

// Test data
let authToken = '';
let testTeacherId = '';
let testClassId = '';
let testAssignmentId = '';

// Helper functions
const log = (message, data = '') => {
  console.log(`\n🔹 ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const logError = (message, error) => {
  console.error(`\n❌ ${message}`);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
};

const logSuccess = (message, data = '') => {
  console.log(`\n✅ ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

// Test functions
async function loginAsAdmin() {
  try {
    log('Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.token;
    logSuccess('Admin login successful');
    return true;
  } catch (error) {
    logError('Admin login failed', error);
    return false;
  }
}

async function createTestTeacher() {
  try {
    log('Creating test teacher...');
    const teacherData = {
      name: 'Test Teacher Assignment',
      email: 'testteacher_assignment@example.com',
      phone: '1234567890',
      designation: 'TGT',
      subjects: ['Mathematics', 'Physics'],
      qualification: {
        degree: 'MSc Mathematics',
        institution: 'Test University',
        yearOfCompletion: 2020
      }
    };

    const response = await axios.post(`${BASE_URL}/admin/teachers`, teacherData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testTeacherId = response.data.data._id;
    logSuccess('Test teacher created', { id: testTeacherId, name: response.data.data.name });
    return true;
  } catch (error) {
    logError('Failed to create test teacher', error);
    return false;
  }
}

async function createTestClass() {
  try {
    log('Creating test class...');
    const classData = {
      name: 'Class 10',
      section: 'A',
      academicYear: '2024-2025',
      roomNumber: 'R101',
      capacity: 40
    };

    const response = await axios.post(`${BASE_URL}/classes`, classData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testClassId = response.data.data._id;
    logSuccess('Test class created', { id: testClassId, name: response.data.data.name });
    return true;
  } catch (error) {
    logError('Failed to create test class', error);
    return false;
  }
}

async function testCreateAssignment() {
  try {
    log('Testing assignment creation...');
    const assignmentData = {
      teacher: testTeacherId,
      class: testClassId,
      subject: 'Mathematics',
      day: 'monday',
      startTime: '09:00',
      endTime: '10:00',
      academicYear: '2024-2025',
      notes: 'Regular math class'
    };

    const response = await axios.post(`${BASE_URL}/admin/assignments`, assignmentData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    testAssignmentId = response.data.data._id;
    logSuccess('Assignment created successfully', response.data.data);
    return true;
  } catch (error) {
    logError('Failed to create assignment', error);
    return false;
  }
}

async function testTimeConflictValidation() {
  try {
    log('Testing time conflict validation...');
    const conflictingAssignment = {
      teacher: testTeacherId,
      class: testClassId,
      subject: 'Physics',
      day: 'monday',
      startTime: '09:30',  // Overlaps with existing assignment
      endTime: '10:30',
      academicYear: '2024-2025',
      notes: 'This should fail due to time conflict'
    };

    try {
      await axios.post(`${BASE_URL}/admin/assignments`, conflictingAssignment, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('Time conflict validation failed - assignment was created when it should have been rejected');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 409) {
        logSuccess('Time conflict validation working correctly', error.response.data);
        return true;
      } else {
        logError('Unexpected error during time conflict test', error);
        return false;
      }
    }
  } catch (error) {
    logError('Time conflict test failed', error);
    return false;
  }
}

async function testGetAllAssignments() {
  try {
    log('Testing get all assignments...');
    const response = await axios.get(`${BASE_URL}/admin/assignments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved all assignments', {
      total: response.data.pagination.total,
      currentPage: response.data.pagination.current,
      assignments: response.data.data.length
    });
    return true;
  } catch (error) {
    logError('Failed to get all assignments', error);
    return false;
  }
}

async function testGetAssignmentById() {
  try {
    log('Testing get assignment by ID...');
    const response = await axios.get(`${BASE_URL}/admin/assignments/${testAssignmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved assignment by ID', response.data.data);
    return true;
  } catch (error) {
    logError('Failed to get assignment by ID', error);
    return false;
  }
}

async function testUpdateAssignment() {
  try {
    log('Testing assignment update...');
    const updateData = {
      subject: 'Advanced Mathematics',
      startTime: '10:00',
      endTime: '11:00',
      notes: 'Updated to advanced math class'
    };

    const response = await axios.put(`${BASE_URL}/admin/assignments/${testAssignmentId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Assignment updated successfully', response.data.data);
    return true;
  } catch (error) {
    logError('Failed to update assignment', error);
    return false;
  }
}

async function testGetAssignmentsByTeacher() {
  try {
    log('Testing get assignments by teacher...');
    const response = await axios.get(`${BASE_URL}/admin/assignments/teacher/${testTeacherId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved assignments by teacher', {
      totalAssignments: response.data.data.totalAssignments,
      groupedByDay: Object.keys(response.data.data.groupedByDay)
    });
    return true;
  } catch (error) {
    logError('Failed to get assignments by teacher', error);
    return false;
  }
}

async function testGetAssignmentsByClass() {
  try {
    log('Testing get assignments by class...');
    const response = await axios.get(`${BASE_URL}/admin/assignments/class/${testClassId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved assignments by class', {
      totalAssignments: response.data.data.totalAssignments,
      subjects: response.data.data.subjects,
      timetable: Object.keys(response.data.data.timetable)
    });
    return true;
  } catch (error) {
    logError('Failed to get assignments by class', error);
    return false;
  }
}

async function testGetTeacherDaySchedule() {
  try {
    log('Testing get teacher day schedule...');
    const response = await axios.get(`${BASE_URL}/admin/assignments/teacher/${testTeacherId}/schedule/monday`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved teacher day schedule', {
      day: response.data.data.day,
      totalPeriods: response.data.data.totalPeriods,
      assignments: response.data.data.assignments.length
    });
    return true;
  } catch (error) {
    logError('Failed to get teacher day schedule', error);
    return false;
  }
}

async function testGetAssignmentStatistics() {
  try {
    log('Testing get assignment statistics...');
    const response = await axios.get(`${BASE_URL}/admin/assignments/statistics/overview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Retrieved assignment statistics', {
      totalAssignments: response.data.data.totalAssignments,
      subjectCount: response.data.data.subjectDistribution.length,
      dayCount: response.data.data.dayDistribution.length
    });
    return true;
  } catch (error) {
    logError('Failed to get assignment statistics', error);
    return false;
  }
}

async function testFilteringAndPagination() {
  try {
    log('Testing filtering and pagination...');
    
    // Test filtering by teacher
    const teacherFilter = await axios.get(`${BASE_URL}/admin/assignments?teacher=${testTeacherId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Test filtering by day
    const dayFilter = await axios.get(`${BASE_URL}/admin/assignments?day=monday`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // Test pagination
    const pagination = await axios.get(`${BASE_URL}/admin/assignments?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Filtering and pagination tests passed', {
      teacherFilterResults: teacherFilter.data.data.length,
      dayFilterResults: dayFilter.data.data.length,
      paginationLimit: pagination.data.pagination.limit
    });
    return true;
  } catch (error) {
    logError('Failed filtering and pagination tests', error);
    return false;
  }
}

async function testValidationErrors() {
  try {
    log('Testing validation errors...');
    
    // Test missing required fields
    try {
      await axios.post(`${BASE_URL}/admin/assignments`, {
        teacher: testTeacherId,
        // Missing class, subject, day, time
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('Validation test failed - should have rejected missing fields');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('Missing required fields validation working');
      } else {
        throw error;
      }
    }

    // Test invalid time format
    try {
      await axios.post(`${BASE_URL}/admin/assignments`, {
        teacher: testTeacherId,
        class: testClassId,
        subject: 'Test Subject',
        day: 'tuesday',
        startTime: '25:00', // Invalid time
        endTime: '26:00'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('Validation test failed - should have rejected invalid time format');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('Invalid time format validation working');
      } else {
        throw error;
      }
    }

    // Test end time before start time
    try {
      await axios.post(`${BASE_URL}/admin/assignments`, {
        teacher: testTeacherId,
        class: testClassId,
        subject: 'Test Subject',
        day: 'tuesday',
        startTime: '11:00',
        endTime: '10:00' // End before start
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('Validation test failed - should have rejected end time before start time');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('End time before start time validation working');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError('Validation error tests failed', error);
    return false;
  }
}

async function testDeleteAssignment() {
  try {
    log('Testing assignment deletion...');
    const response = await axios.delete(`${BASE_URL}/admin/assignments/${testAssignmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logSuccess('Assignment deleted successfully', response.data);
    
    // Verify assignment is no longer active
    try {
      const getResponse = await axios.get(`${BASE_URL}/admin/assignments/${testAssignmentId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (getResponse.data.data.isActive === false) {
        logSuccess('Assignment successfully soft deleted');
        return true;
      } else {
        logError('Assignment deletion failed - assignment is still active');
        return false;
      }
    } catch (error) {
      logError('Failed to verify assignment deletion', error);
      return false;
    }
  } catch (error) {
    logError('Failed to delete assignment', error);
    return false;
  }
}

async function testEdgeCases() {
  try {
    log('Testing edge cases...');
    
    // Test invalid teacher ID
    try {
      await axios.post(`${BASE_URL}/admin/assignments`, {
        teacher: '507f1f77bcf86cd799439011', // Non-existent ID
        class: testClassId,
        subject: 'Test Subject',
        day: 'wednesday',
        startTime: '09:00',
        endTime: '10:00'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('Edge case test failed - should have rejected non-existent teacher');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('Non-existent teacher validation working');
      } else {
        throw error;
      }
    }

    // Test invalid class ID
    try {
      await axios.post(`${BASE_URL}/admin/assignments`, {
        teacher: testTeacherId,
        class: '507f1f77bcf86cd799439011', // Non-existent ID
        subject: 'Test Subject',
        day: 'wednesday',
        startTime: '09:00',
        endTime: '10:00'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('Edge case test failed - should have rejected non-existent class');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('Non-existent class validation working');
      } else {
        throw error;
      }
    }

    // Test invalid assignment ID for get/update/delete
    try {
      await axios.get(`${BASE_URL}/admin/assignments/507f1f77bcf86cd799439011`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logError('Edge case test failed - should have rejected non-existent assignment');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logSuccess('Non-existent assignment validation working');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError('Edge case tests failed', error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Teacher Assignment System Tests');
  console.log('==========================================');

  const tests = [
    { name: 'Admin Login', fn: loginAsAdmin },
    { name: 'Create Test Teacher', fn: createTestTeacher },
    { name: 'Create Test Class', fn: createTestClass },
    { name: 'Create Assignment', fn: testCreateAssignment },
    { name: 'Time Conflict Validation', fn: testTimeConflictValidation },
    { name: 'Get All Assignments', fn: testGetAllAssignments },
    { name: 'Get Assignment by ID', fn: testGetAssignmentById },
    { name: 'Update Assignment', fn: testUpdateAssignment },
    { name: 'Get Assignments by Teacher', fn: testGetAssignmentsByTeacher },
    { name: 'Get Assignments by Class', fn: testGetAssignmentsByClass },
    { name: 'Get Teacher Day Schedule', fn: testGetTeacherDaySchedule },
    { name: 'Get Assignment Statistics', fn: testGetAssignmentStatistics },
    { name: 'Filtering and Pagination', fn: testFilteringAndPagination },
    { name: 'Validation Errors', fn: testValidationErrors },
    { name: 'Edge Cases', fn: testEdgeCases },
    { name: 'Delete Assignment', fn: testDeleteAssignment }
  ];

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n📋 Running test ${i + 1}/${tests.length}: ${test.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name} PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name} FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} FAILED with exception`);
      logError('Exception details', error);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(2)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Teacher Assignment System is working perfectly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Tests interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('🚨 Test runner failed:', error);
  process.exit(1);
});