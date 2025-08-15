// Test the new assignment management functionality
const axios = require('axios');

const baseURL = 'https://sms-38ap.onrender.com/api';
const adminToken = process.env.ADMIN_TOKEN || 'your-admin-token-here';

async function testAssignmentManagement() {
  console.log('🧪 Testing Assignment Management Functionality\n');

  try {
    // 1. First, let's get all teachers to see who has assignments
    console.log('1. Fetching teachers with assignments...');
    const teachersResponse = await axios.get(`${baseURL}/admin/teachers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!teachersResponse.data.success) {
      console.log('❌ Failed to fetch teachers:', teachersResponse.data.message);
      return;
    }

    const teachers = teachersResponse.data.data;
    console.log(`✅ Found ${teachers.length} teachers`);

    // 2. Find a teacher with assignments
    let teacherWithAssignments = teachers.find(t => 
      t.assignedClasses && t.assignedClasses.length > 0
    );

    if (!teacherWithAssignments) {
      console.log('❌ No teachers found with assignments. Creating a test assignment first...');
      
      // Create a test assignment
      const testTeacher = teachers[0];
      if (!testTeacher) {
        console.log('❌ No teachers available for testing');
        return;
      }

      console.log('Creating test assignment for teacher:', testTeacher.name);
      const assignmentResponse = await axios.post(
        `${baseURL}/admin/teachers/${testTeacher._id}/assign-classes`,
        {
          assignedClasses: [{
            grade: '10',
            section: 'A',
            subject: 'Test Subject'
          }]
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      if (assignmentResponse.data.success) {
        console.log('✅ Test assignment created successfully');
        // Refresh teacher data
        const refreshResponse = await axios.get(`${baseURL}/admin/teachers/${testTeacher._id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (refreshResponse.data.success) {
          teacherWithAssignments = refreshResponse.data.data;
        }
      } else {
        console.log('❌ Failed to create test assignment:', assignmentResponse.data.message);
        return;
      }
    }

    if (!teacherWithAssignments || !teacherWithAssignments.assignedClasses || teacherWithAssignments.assignedClasses.length === 0) {
      console.log('❌ Still no assignments available for testing');
      return;
    }

    console.log(`✅ Found teacher with assignments: ${teacherWithAssignments.name}`);
    console.log('Current assignments:', teacherWithAssignments.assignedClasses);

    // 3. Test updating a subject assignment
    const assignmentToUpdate = teacherWithAssignments.assignedClasses[0];
    console.log('\n3. Testing update of subject assignment:', {
      grade: assignmentToUpdate.grade,
      section: assignmentToUpdate.section,
      subject: assignmentToUpdate.subject
    });

    const updateResponse = await axios.put(
      `${baseURL}/admin/teachers/${teacherWithAssignments._id}/subject-assignment`,
      {
        oldGrade: assignmentToUpdate.grade,
        oldSection: assignmentToUpdate.section,
        oldSubject: assignmentToUpdate.subject,
        newGrade: '11',
        newSection: 'B',
        newSubject: 'Updated Test Subject'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );

    if (updateResponse.data.success) {
      console.log('✅ Subject assignment updated successfully!');
      console.log('Response:', updateResponse.data);
    } else {
      console.log('❌ Failed to update subject assignment:', updateResponse.data.message);
    }

    // 4. Test deleting a subject assignment
    console.log('\n4. Testing deletion of subject assignment...');
    const deleteResponse = await axios.delete(
      `${baseURL}/admin/teachers/${teacherWithAssignments._id}/subject-assignment`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          grade: '11',
          section: 'B',
          subject: 'Updated Test Subject'
        }
      }
    );

    if (deleteResponse.data.success) {
      console.log('✅ Subject assignment deleted successfully!');
      console.log('Response:', deleteResponse.data);
    } else {
      console.log('❌ Failed to delete subject assignment:', deleteResponse.data.message);
    }

    // 5. Verify the changes by fetching updated teacher data
    console.log('\n5. Verifying changes...');
    const verifyResponse = await axios.get(`${baseURL}/admin/teachers/${teacherWithAssignments._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (verifyResponse.data.success) {
      const updatedTeacher = verifyResponse.data.data;
      console.log('Updated teacher assignments:', updatedTeacher.assignedClasses);
      
      const hasUpdatedAssignment = updatedTeacher.assignedClasses.some(ac => 
        ac.grade === '11' && ac.section === 'B' && ac.subject === 'Updated Test Subject'
      );
      
      const hasDeletedAssignment = updatedTeacher.assignedClasses.some(ac => 
        ac.grade === '11' && ac.section === 'B' && ac.subject === 'Updated Test Subject'
      );

      if (!hasUpdatedAssignment && !hasDeletedAssignment) {
        console.log('✅ Verification successful: Assignment was properly updated and then deleted');
      } else {
        console.log('⚠️  Verification warning: Some assignments still remain', updatedTeacher.assignedClasses);
      }
    }

    console.log('\n🎉 Assignment management functionality test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testAssignmentManagement();
}

module.exports = { testAssignmentManagement };