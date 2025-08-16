const mongoose = require('mongoose');
const Class = require('./backend/models/Class');
const Teacher = require('./backend/models/Teacher');
const Student = require('./backend/models/Student');
const Homework = require('./backend/models/Homework');
const Test = require('./backend/models/Test');
const Result = require('./backend/models/Result');
const Attendance = require('./backend/models/Attendance');
const Session = require('./backend/models/Session');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management_test';

async function testClassDeletionCleanup() {
  try {
    console.log('🧪 Testing Class Deletion Cleanup\n');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test session
    const testSession = await Session.create({
      name: 'Test Session 2024',
      academicYear: '2024-2025',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      status: 'active',
      isCurrent: true
    });
    console.log('✅ Created test session:', testSession.name);
    
    // Create test class
    const testClass = await Class.create({
      name: 'Class 10',
      section: 'A',
      academicYear: '2024-2025',
      session: testSession.name,
      roomNumber: '101',
      capacity: 40
    });
    console.log('✅ Created test class:', `${testClass.name} Section ${testClass.section}`);
    
    // Create test teacher
    const testTeacher = await Teacher.create({
      user: new mongoose.Types.ObjectId(),
      name: 'Test Teacher',
      email: 'test.teacher@school.com',
      phone: '1234567890',
      designation: 'PGT',
      subjects: ['Mathematics', 'Physics'],
      assignedClasses: [{
        class: testClass._id,
        section: testClass.section,
        subject: 'Mathematics',
        grade: testClass.name,
        time: '09:00 AM',
        day: 'Monday'
      }]
    });
    console.log('✅ Created test teacher with class assignment');
    
    // Create test homework
    const testHomework = await Homework.create({
      title: 'Test Homework',
      description: 'Test homework description',
      subject: 'Mathematics',
      class: testClass._id,
      assignedBy: new mongoose.Types.ObjectId(),
      dueDate: new Date('2024-12-31')
    });
    console.log('✅ Created test homework');
    
    // Create test test
    const testTest = await Test.create({
      title: 'Test Exam',
      subject: 'Mathematics',
      class: testClass._id,
      type: 'test',
      totalMarks: 100,
      duration: 60,
      date: new Date('2024-12-31'),
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      createdBy: new mongoose.Types.ObjectId()
    });
    console.log('✅ Created test test');
    
    // Create test result
    const testResult = await Result.create({
      studentId: new mongoose.Types.ObjectId(),
      classId: testClass._id,
      session: testSession.name,
      academicYear: '2024-2025',
      term: 'first',
      subjects: [{
        name: 'Mathematics',
        theoryMarks: 80,
        practicalMarks: 20,
        totalMarks: 100,
        maxMarks: 100,
        percentage: 100,
        grade: 'A'
      }],
      totalMarks: 100,
      maxMarks: 100,
      percentage: 100,
      grade: 'A',
      compiledBy: new mongoose.Types.ObjectId()
    });
    console.log('✅ Created test result');
    
    // Create test attendance
    const testAttendance = await Attendance.create({
      studentId: new mongoose.Types.ObjectId(),
      classId: testClass._id,
      session: testSession.name,
      date: new Date(),
      status: 'present',
      markedBy: new mongoose.Types.ObjectId()
    });
    console.log('✅ Created test attendance record');
    
    // Add archived class data to session
    await Session.findByIdAndUpdate(testSession._id, {
      $push: {
        'archivedData.classes': {
          classId: testClass._id,
          archivedAt: new Date()
        }
      }
    });
    console.log('✅ Added archived class data to session');
    
    // Verify all data exists
    console.log('\n🔍 Verifying test data exists...');
    const teacherWithAssignment = await Teacher.findById(testTeacher._id);
    const homeworkExists = await Homework.findById(testHomework._id);
    const testExists = await Test.findById(testTest._id);
    const resultExists = await Result.findById(testResult._id);
    const attendanceExists = await Attendance.findById(testAttendance._id);
    const sessionWithArchivedData = await Session.findById(testSession._id);
    
    console.log(`  - Teacher assignment: ${teacherWithAssignment.assignedClasses.length > 0 ? '✅' : '❌'}`);
    console.log(`  - Homework: ${homeworkExists ? '✅' : '❌'}`);
    console.log(`  - Test: ${testExists ? '✅' : '❌'}`);
    console.log(`  - Result: ${resultExists ? '✅' : '❌'}`);
    console.log(`  - Attendance: ${attendanceExists ? '✅' : '❌'}`);
    console.log(`  - Archived class data: ${sessionWithArchivedData.archivedData.classes.length > 0 ? '✅' : '❌'}`);
    
    // Now delete the class
    console.log('\n🗑️  Deleting test class...');
    await Class.findByIdAndDelete(testClass._id);
    console.log('✅ Class deleted');
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    
    // Check teacher assignments
    const updatedTeacher = await Teacher.findById(testTeacher._id);
    const teacherAssignmentsCleaned = updatedTeacher.assignedClasses.length === 0;
    console.log(`  - Teacher assignments cleaned: ${teacherAssignmentsCleaned ? '✅' : '❌'}`);
    
    // Check homework
    const homeworkCleaned = await Homework.findById(testHomework._id);
    const homeworkCleanedUp = !homeworkCleaned;
    console.log(`  - Homework cleaned: ${homeworkCleanedUp ? '✅' : '❌'}`);
    
    // Check test
    const testCleaned = await Test.findById(testTest._id);
    const testCleanedUp = !testCleaned;
    console.log(`  - Test cleaned: ${testCleanedUp ? '✅' : '❌'}`);
    
    // Check result
    const resultCleaned = await Result.findById(testResult._id);
    const resultCleanedUp = !resultCleaned;
    console.log(`  - Result cleaned: ${resultCleanedUp ? '✅' : '❌'}`);
    
    // Check attendance
    const attendanceCleaned = await Attendance.findById(testAttendance._id);
    const attendanceCleanedUp = !attendanceCleaned;
    console.log(`  - Attendance cleaned: ${attendanceCleanedUp ? '✅' : '❌'}`);
    
    // Check archived class data
    const updatedSession = await Session.findById(testSession._id);
    const archivedDataCleaned = updatedSession.archivedData.classes.length === 0;
    console.log(`  - Archived class data cleaned: ${archivedDataCleaned ? '✅' : '❌'}`);
    
    // Summary
    const allClean = teacherAssignmentsCleaned && homeworkCleanedUp && testCleanedUp && 
                    resultCleanedUp && attendanceCleanedUp && archivedDataCleaned;
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`  - Teacher assignments: ${teacherAssignmentsCleaned ? '✅' : '❌'}`);
    console.log(`  - Homework: ${homeworkCleanedUp ? '✅' : '❌'}`);
    console.log(`  - Tests: ${testCleanedUp ? '✅' : '❌'}`);
    console.log(`  - Results: ${resultCleanedUp ? '✅' : '❌'}`);
    console.log(`  - Attendance: ${attendanceCleanedUp ? '✅' : '❌'}`);
    console.log(`  - Archived class data: ${archivedDataCleaned ? '✅' : '❌'}`);
    
    if (allClean) {
      console.log('\n🎉 All cleanup operations successful! Class deletion is working properly.');
    } else {
      console.log('\n⚠️  Some cleanup operations failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up test data
    await cleanupTestData();
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

async function cleanupTestData() {
  try {
    // Clean up all test data
    await Class.deleteMany({ name: 'Class 10', section: 'A' });
    await Teacher.deleteMany({ email: 'test.teacher@school.com' });
    await Homework.deleteMany({ title: 'Test Homework' });
    await Test.deleteMany({ title: 'Test Exam' });
    await Result.deleteMany({ term: 'first' });
    await Attendance.deleteMany({ status: 'present' });
    await Session.deleteMany({ name: 'Test Session 2024' });
    console.log('🧹 Cleaned up test data');
  } catch (error) {
    console.log('⚠️  Error cleaning up test data:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testClassDeletionCleanup();
}

module.exports = { testClassDeletionCleanup };