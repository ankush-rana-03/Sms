const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Teacher = require('./backend/models/Teacher');
const Class = require('./backend/models/Class');
const User = require('./backend/models/User');

async function testSubjectAssignmentFunctionality() {
  try {
    console.log('🧪 Starting Subject Assignment Functionality Test\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Check if models are working
    console.log('📝 Test 1: Model Loading');
    console.log('Teacher model:', Teacher.modelName);
    console.log('Class model:', Class.modelName);
    console.log('User model:', User.modelName);
    console.log('✅ All models loaded successfully\n');
    
    // Test 2: Check existing data
    console.log('📝 Test 2: Existing Data Check');
    const teacherCount = await Teacher.countDocuments();
    const classCount = await Class.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`Teachers in DB: ${teacherCount}`);
    console.log(`Classes in DB: ${classCount}`);
    console.log(`Users in DB: ${userCount}`);
    
    // Get sample teacher for testing
    const sampleTeacher = await Teacher.findOne().populate('assignedClasses.class');
    if (sampleTeacher) {
      console.log(`Sample teacher: ${sampleTeacher.name} (${sampleTeacher._id})`);
      console.log(`Current assignments: ${sampleTeacher.assignedClasses.length}`);
      console.log('Assignment details:', JSON.stringify(sampleTeacher.assignedClasses, null, 2));
    } else {
      console.log('No teachers found in database');
    }
    
    // Get sample classes
    const sampleClasses = await Class.find().limit(3);
    console.log(`Sample classes (${sampleClasses.length}):`);
    sampleClasses.forEach(cls => {
      console.log(`  - ${cls.name} Section ${cls.section} (${cls._id})`);
    });
    console.log('✅ Data check completed\n');
    
    // Test 3: Test assignment creation
    if (sampleTeacher && sampleClasses.length > 0) {
      console.log('📝 Test 3: Assignment Creation Test');
      
      const testAssignments = [
        {
          class: sampleClasses[0]._id,
          section: sampleClasses[0].section,
          subject: 'Mathematics',
          grade: sampleClasses[0].name.replace('Class ', ''),
          time: '9:00 AM',
          day: 'Monday'
        },
        {
          class: sampleClasses[0]._id,
          section: sampleClasses[0].section,
          subject: 'Physics',
          grade: sampleClasses[0].name.replace('Class ', ''),
          time: '10:00 AM',
          day: 'Tuesday'
        }
      ];
      
      console.log('Test assignments to save:', JSON.stringify(testAssignments, null, 2));
      
      // Save assignments
      sampleTeacher.assignedClasses = testAssignments;
      
      console.log('Before save - assignedClasses:', JSON.stringify(sampleTeacher.assignedClasses, null, 2));
      
      await sampleTeacher.save();
      
      console.log('After save - assignedClasses:', JSON.stringify(sampleTeacher.assignedClasses, null, 2));
      
      // Verify by fetching from database
      const verifyTeacher = await Teacher.findById(sampleTeacher._id).populate('assignedClasses.class');
      console.log('Verification fetch - assignedClasses:', JSON.stringify(verifyTeacher.assignedClasses, null, 2));
      
      console.log('✅ Assignment creation test completed\n');
    } else {
      console.log('⚠️ Skipping assignment creation test - no sample data available\n');
    }
    
    // Test 4: Test API endpoint simulation
    console.log('📝 Test 4: API Endpoint Simulation');
    
    if (sampleTeacher && sampleClasses.length > 0) {
      // Simulate the assignClassesToTeacher controller logic
      const assignedClasses = [
        {
          class: sampleClasses[0]._id.toString(),
          section: sampleClasses[0].section,
          subject: 'Chemistry',
          grade: sampleClasses[0].name.replace('Class ', ''),
          time: '11:00 AM',
          day: 'Wednesday'
        }
      ];
      
      console.log('Simulating API call with data:', JSON.stringify(assignedClasses, null, 2));
      
      // Validate classes exist
      for (const assignment of assignedClasses) {
        const classExists = await Class.findById(assignment.class);
        if (!classExists) {
          console.log(`❌ Class not found: ${assignment.class}`);
        } else {
          console.log(`✅ Class exists: ${classExists.name} Section ${classExists.section}`);
        }
      }
      
      // Transform assignments (like in controller)
      const transformedAssignments = assignedClasses.map(assignment => ({
        class: assignment.class,
        section: assignment.section,
        subject: assignment.subject,
        grade: assignment.grade,
        time: assignment.time || '9:00 AM',
        day: assignment.day || 'Monday'
      }));
      
      console.log('Transformed assignments:', JSON.stringify(transformedAssignments, null, 2));
      
      // Save to teacher
      sampleTeacher.assignedClasses = transformedAssignments;
      await sampleTeacher.save();
      
      // Verify save
      const verifiedTeacher = await Teacher.findById(sampleTeacher._id).populate('assignedClasses.class');
      console.log('Final verification:', JSON.stringify(verifiedTeacher.assignedClasses, null, 2));
      
      console.log('✅ API simulation test completed\n');
    }
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

// Run the test
testSubjectAssignmentFunctionality();