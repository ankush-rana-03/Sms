const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test data
const testData = {
  teacherId: '507f1f77bcf86cd799439011', // Replace with actual teacher ID
  classId: '507f1f77bcf86cd799439012',   // Replace with actual class ID
  subject: 'Mathematics',
  day: 'Monday',
  startTime: '09:00',
  endTime: '10:00',
  academicYear: '2024-2025',
  semester: 'First',
  notes: 'Advanced Mathematics for Grade 10'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test functions
const testCreateAssignment = async () => {
  console.log('\n=== Testing Assignment Creation ===');
  
  const result = await makeRequest('POST', '/assignments', testData);
  
  if (result.success) {
    console.log('✅ Assignment created successfully');
    console.log('Assignment ID:', result.data.data._id);
    return result.data.data._id;
  } else {
    console.log('❌ Failed to create assignment');
    console.log('Error:', result.error);
    return null;
  }
};

const testCreateAssignmentWithConflict = async () => {
  console.log('\n=== Testing Assignment Creation with Time Conflict ===');
  
  const conflictData = {
    ...testData,
    startTime: '09:30', // Overlaps with existing assignment
    endTime: '10:30'
  };
  
  const result = await makeRequest('POST', '/assignments', conflictData);
  
  if (!result.success && result.status === 409) {
    console.log('✅ Time conflict correctly detected');
    console.log('Error:', result.error.message);
  } else {
    console.log('❌ Time conflict not detected properly');
    console.log('Result:', result);
  }
};

const testGetAllAssignments = async () => {
  console.log('\n=== Testing Get All Assignments ===');
  
  const result = await makeRequest('GET', '/assignments');
  
  if (result.success) {
    console.log('✅ Assignments retrieved successfully');
    console.log('Total assignments:', result.data.total);
    console.log('Current page assignments:', result.data.count);
  } else {
    console.log('❌ Failed to retrieve assignments');
    console.log('Error:', result.error);
  }
};

const testGetAssignmentById = async (assignmentId) => {
  console.log('\n=== Testing Get Assignment by ID ===');
  
  const result = await makeRequest('GET', `/assignments/${assignmentId}`);
  
  if (result.success) {
    console.log('✅ Assignment retrieved successfully');
    console.log('Subject:', result.data.data.subject);
    console.log('Teacher:', result.data.data.teacher.name);
    console.log('Class:', result.data.data.class.name);
  } else {
    console.log('❌ Failed to retrieve assignment');
    console.log('Error:', result.error);
  }
};

const testUpdateAssignment = async (assignmentId) => {
  console.log('\n=== Testing Assignment Update ===');
  
  const updateData = {
    subject: 'Advanced Mathematics',
    notes: 'Updated notes for advanced mathematics class'
  };
  
  const result = await makeRequest('PUT', `/assignments/${assignmentId}`, updateData);
  
  if (result.success) {
    console.log('✅ Assignment updated successfully');
    console.log('Updated subject:', result.data.data.subject);
    console.log('Updated notes:', result.data.data.notes);
  } else {
    console.log('❌ Failed to update assignment');
    console.log('Error:', result.error);
  }
};

const testUpdateAssignmentWithConflict = async (assignmentId) => {
  console.log('\n=== Testing Assignment Update with Time Conflict ===');
  
  const updateData = {
    startTime: '08:00',
    endTime: '09:00'
  };
  
  const result = await makeRequest('PUT', `/assignments/${assignmentId}`, updateData);
  
  if (result.success) {
    console.log('✅ Assignment updated successfully (no conflict)');
  } else if (result.status === 409) {
    console.log('✅ Time conflict correctly detected during update');
    console.log('Error:', result.error.message);
  } else {
    console.log('❌ Unexpected result during conflict update');
    console.log('Result:', result);
  }
};

const testGetAssignmentsByTeacher = async () => {
  console.log('\n=== Testing Get Assignments by Teacher ===');
  
  const result = await makeRequest('GET', `/assignments/teacher/${testData.teacherId}`);
  
  if (result.success) {
    console.log('✅ Teacher assignments retrieved successfully');
    console.log('Total assignments for teacher:', result.data.count);
  } else {
    console.log('❌ Failed to retrieve teacher assignments');
    console.log('Error:', result.error);
  }
};

const testGetAssignmentsByClass = async () => {
  console.log('\n=== Testing Get Assignments by Class ===');
  
  const result = await makeRequest('GET', `/assignments/class/${testData.classId}`);
  
  if (result.success) {
    console.log('✅ Class assignments retrieved successfully');
    console.log('Total assignments for class:', result.data.count);
  } else {
    console.log('❌ Failed to retrieve class assignments');
    console.log('Error:', result.error);
  }
};

const testGetTeacherWeeklySchedule = async () => {
  console.log('\n=== Testing Get Teacher Weekly Schedule ===');
  
  const result = await makeRequest('GET', `/assignments/teacher/${testData.teacherId}/schedule`);
  
  if (result.success) {
    console.log('✅ Teacher weekly schedule retrieved successfully');
    const schedule = result.data.data;
    Object.keys(schedule).forEach(day => {
      if (schedule[day].length > 0) {
        console.log(`${day}: ${schedule[day].length} classes`);
      }
    });
  } else {
    console.log('❌ Failed to retrieve teacher weekly schedule');
    console.log('Error:', result.error);
  }
};

const testGetClassWeeklySchedule = async () => {
  console.log('\n=== Testing Get Class Weekly Schedule ===');
  
  const result = await makeRequest('GET', `/assignments/class/${testData.classId}/schedule`);
  
  if (result.success) {
    console.log('✅ Class weekly schedule retrieved successfully');
    const schedule = result.data.data;
    Object.keys(schedule).forEach(day => {
      if (schedule[day].length > 0) {
        console.log(`${day}: ${schedule[day].length} subjects`);
      }
    });
  } else {
    console.log('❌ Failed to retrieve class weekly schedule');
    console.log('Error:', result.error);
  }
};

const testCheckTimeConflicts = async () => {
  console.log('\n=== Testing Time Conflict Check ===');
  
  const conflictCheckData = {
    teacherId: testData.teacherId,
    day: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    semester: 'First'
  };
  
  const result = await makeRequest('POST', '/assignments/check-conflicts', conflictCheckData);
  
  if (result.success) {
    console.log('✅ Time conflict check completed');
    console.log('Has conflicts:', result.data.hasConflicts);
    if (result.data.conflicts.length > 0) {
      console.log('Conflicts found:', result.data.conflicts.length);
    }
  } else {
    console.log('❌ Failed to check time conflicts');
    console.log('Error:', result.error);
  }
};

const testBulkCreateAssignments = async () => {
  console.log('\n=== Testing Bulk Create Assignments ===');
  
  const bulkData = {
    assignments: [
      {
        teacherId: testData.teacherId,
        classId: testData.classId,
        subject: 'Physics',
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '10:00',
        semester: 'First',
        notes: 'Physics class for Grade 10'
      },
      {
        teacherId: testData.teacherId,
        classId: testData.classId,
        subject: 'Chemistry',
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '10:00',
        semester: 'First',
        notes: 'Chemistry class for Grade 10'
      }
    ]
  };
  
  const result = await makeRequest('POST', '/assignments/bulk', bulkData);
  
  if (result.success) {
    console.log('✅ Bulk assignments created successfully');
    console.log('Created:', result.data.created);
    console.log('Failed:', result.data.failed);
  } else {
    console.log('❌ Failed to create bulk assignments');
    console.log('Error:', result.error);
  }
};

const testFilteringAndSearch = async () => {
  console.log('\n=== Testing Filtering and Search ===');
  
  // Test filtering by day
  const dayFilterResult = await makeRequest('GET', '/assignments?day=Monday');
  if (dayFilterResult.success) {
    console.log('✅ Day filtering works');
    console.log('Monday assignments:', dayFilterResult.data.count);
  }
  
  // Test filtering by subject
  const subjectFilterResult = await makeRequest('GET', '/assignments?subject=Mathematics');
  if (subjectFilterResult.success) {
    console.log('✅ Subject filtering works');
    console.log('Mathematics assignments:', subjectFilterResult.data.count);
  }
  
  // Test search functionality
  const searchResult = await makeRequest('GET', '/assignments?search=advanced');
  if (searchResult.success) {
    console.log('✅ Search functionality works');
    console.log('Search results:', searchResult.data.count);
  }
};

const testPagination = async () => {
  console.log('\n=== Testing Pagination ===');
  
  const result = await makeRequest('GET', '/assignments?page=1&limit=5');
  
  if (result.success) {
    console.log('✅ Pagination works');
    console.log('Page:', result.data.page);
    console.log('Limit:', result.data.limit);
    console.log('Total pages:', result.data.totalPages);
    console.log('Current page items:', result.data.count);
  } else {
    console.log('❌ Pagination failed');
    console.log('Error:', result.error);
  }
};

const testDeleteAssignment = async (assignmentId) => {
  console.log('\n=== Testing Assignment Deletion ===');
  
  const result = await makeRequest('DELETE', `/assignments/${assignmentId}`);
  
  if (result.success) {
    console.log('✅ Assignment deleted successfully');
  } else {
    console.log('❌ Failed to delete assignment');
    console.log('Error:', result.error);
  }
};

const testValidationErrors = async () => {
  console.log('\n=== Testing Validation Errors ===');
  
  // Test missing required fields
  const missingFieldsData = {
    teacherId: testData.teacherId,
    // Missing classId, subject, day, startTime, endTime, semester
  };
  
  const missingFieldsResult = await makeRequest('POST', '/assignments', missingFieldsData);
  if (missingFieldsResult.status === 400) {
    console.log('✅ Missing fields validation works');
  } else {
    console.log('❌ Missing fields validation failed');
  }
  
  // Test invalid time format
  const invalidTimeData = {
    ...testData,
    startTime: '25:00', // Invalid time
    endTime: '26:00'
  };
  
  const invalidTimeResult = await makeRequest('POST', '/assignments', invalidTimeData);
  if (invalidTimeResult.status === 400) {
    console.log('✅ Invalid time format validation works');
  } else {
    console.log('❌ Invalid time format validation failed');
  }
  
  // Test invalid day
  const invalidDayData = {
    ...testData,
    day: 'InvalidDay'
  };
  
  const invalidDayResult = await makeRequest('POST', '/assignments', invalidDayData);
  if (invalidDayResult.status === 400) {
    console.log('✅ Invalid day validation works');
  } else {
    console.log('❌ Invalid day validation failed');
  }
  
  // Test start time after end time
  const invalidTimeOrderData = {
    ...testData,
    startTime: '11:00',
    endTime: '10:00'
  };
  
  const invalidTimeOrderResult = await makeRequest('POST', '/assignments', invalidTimeOrderData);
  if (invalidTimeOrderResult.status === 400) {
    console.log('✅ Time order validation works');
  } else {
    console.log('❌ Time order validation failed');
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Teacher Assignment System Tests');
  console.log('==========================================');
  
  try {
    // Create initial assignment
    const assignmentId = await testCreateAssignment();
    
    if (assignmentId) {
      // Test time conflict during creation
      await testCreateAssignmentWithConflict();
      
      // Test retrieval operations
      await testGetAllAssignments();
      await testGetAssignmentById(assignmentId);
      await testGetAssignmentsByTeacher();
      await testGetAssignmentsByClass();
      await testGetTeacherWeeklySchedule();
      await testGetClassWeeklySchedule();
      
      // Test update operations
      await testUpdateAssignment(assignmentId);
      await testUpdateAssignmentWithConflict(assignmentId);
      
      // Test utility functions
      await testCheckTimeConflicts();
      await testBulkCreateAssignments();
      
      // Test advanced features
      await testFilteringAndSearch();
      await testPagination();
      
      // Test validation
      await testValidationErrors();
      
      // Clean up
      await testDeleteAssignment(assignmentId);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testCreateAssignment,
  testCreateAssignmentWithConflict,
  testGetAllAssignments,
  testGetAssignmentById,
  testUpdateAssignment,
  testUpdateAssignmentWithConflict,
  testGetAssignmentsByTeacher,
  testGetAssignmentsByClass,
  testGetTeacherWeeklySchedule,
  testGetClassWeeklySchedule,
  testCheckTimeConflicts,
  testBulkCreateAssignments,
  testFilteringAndSearch,
  testPagination,
  testValidationErrors,
  testDeleteAssignment
};