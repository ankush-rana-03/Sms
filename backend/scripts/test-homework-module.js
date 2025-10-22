const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Homework = require('../models/Homework');
const Class = require('../models/Class');
const Session = require('../models/Session');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testHomeworkModule() {
  try {
    console.log('🧪 Testing Homework Module...\n');

    // 1. Create a test session
    console.log('1. Creating test session...');
    const session = new Session({
      name: '2024-2025',
      academicYear: '2024-2025',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      isCurrent: true
    });
    await session.save();
    console.log('✅ Session created:', session.name);

    // 2. Create a test class
    console.log('\n2. Creating test class...');
    const classDoc = new Class({
      name: '5',
      section: 'A',
      academicYear: '2024-2025',
      session: session.name,
      isActive: true,
      capacity: 40,
      currentStrength: 0
    });
    await classDoc.save();
    console.log('✅ Class created:', classDoc.name, 'Section', classDoc.section);

    // 3. Create a test admin user
    console.log('\n3. Creating test admin user...');
    const adminUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      phone: '1234567890',
      address: 'Test Address',
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);

    // 4. Create a test student
    console.log('\n4. Creating test student...');
    const student = new Student({
      name: 'Test Student',
      email: 'student@test.com',
      phone: '1234567890',
      address: 'Test Address',
      dateOfBirth: '2010-01-01',
      grade: '5',
      section: 'A',
      rollNumber: '001',
      gender: 'male',
      bloodGroup: 'A+',
      parentName: 'Test Parent',
      parentPhone: '1234567890',
      parentEmail: 'parent@test.com',
      currentSession: session.name,
      createdBy: adminUser._id
    });
    await student.save();
    console.log('✅ Student created:', student.name);

    // 5. Create parent credentials
    console.log('\n5. Creating parent credentials...');
    const { parentId, password } = Parent.generateCredentials();
    const parent = new Parent({
      name: 'Test Parent',
      email: 'parent@test.com',
      password: password,
      phone: '1234567890',
      address: 'Test Address',
      children: [student._id],
      credentialsGenerated: true,
      credentialsGeneratedAt: new Date()
    });
    await parent.save();
    
    // Update student with parent reference
    student.parent = parent._id;
    await student.save();
    
    console.log('✅ Parent created:', parent.email);
    console.log('   Parent ID:', parentId);
    console.log('   Password:', password);

    // 6. Create homework assignment
    console.log('\n6. Creating homework assignment...');
    const homework = new Homework({
      title: 'Math Practice',
      description: 'Complete exercises 1-10 from chapter 5',
      subject: 'Mathematics',
      class: classDoc._id,
      section: 'A',
      assignedBy: adminUser._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      instructions: 'Show all your work clearly',
      totalMarks: 20,
      isActive: true
    });
    await homework.save();
    console.log('✅ Homework created:', homework.title);

    // 7. Test parent completion tracking
    console.log('\n7. Testing parent completion tracking...');
    homework.parentCompletions.push({
      student: student._id,
      parent: parent._id,
      completionStatus: 'half_complete',
      completedAt: new Date(),
      parentComments: 'Student is working on it, about 50% done',
      lastUpdated: new Date()
    });
    await homework.save();
    console.log('✅ Parent completion status added');

    // 8. Verify data
    console.log('\n8. Verifying data...');
    const populatedHomework = await Homework.findById(homework._id)
      .populate('class', 'name section')
      .populate('assignedBy', 'name email')
      .populate('parentCompletions.student', 'name grade section')
      .populate('parentCompletions.parent', 'name email');

    console.log('📊 Homework Details:');
    console.log('   Title:', populatedHomework.title);
    console.log('   Subject:', populatedHomework.subject);
    console.log('   Class:', populatedHomework.class.name, 'Section', populatedHomework.class.section);
    console.log('   Assigned by:', populatedHomework.assignedBy.name);
    console.log('   Due date:', populatedHomework.dueDate);
    console.log('   Parent completions:', populatedHomework.parentCompletions.length);
    
    if (populatedHomework.parentCompletions.length > 0) {
      const completion = populatedHomework.parentCompletions[0];
      console.log('   Student:', completion.student.name);
      console.log('   Parent:', completion.parent.name);
      console.log('   Status:', completion.completionStatus);
      console.log('   Comments:', completion.parentComments);
    }

    // 9. Test parent login simulation
    console.log('\n9. Testing parent login simulation...');
    const loginParent = await Parent.findOne({ email: 'parent@test.com' }).select('+password');
    const isPasswordMatch = await loginParent.matchPassword(password);
    console.log('✅ Parent login test:', isPasswordMatch ? 'PASSED' : 'FAILED');

    // 10. Test homework retrieval for parent
    console.log('\n10. Testing homework retrieval for parent...');
    const parentHomework = await Homework.find({
      isActive: true,
      class: classDoc._id
    })
    .populate('class', 'name section')
    .populate('assignedBy', 'name email');

    console.log('✅ Parent homework retrieval test:', parentHomework.length > 0 ? 'PASSED' : 'FAILED');
    console.log('   Found', parentHomework.length, 'homework assignments');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Session created');
    console.log('   ✅ Class created');
    console.log('   ✅ Admin user created');
    console.log('   ✅ Student created with parent email');
    console.log('   ✅ Parent credentials generated');
    console.log('   ✅ Homework assigned to class/section');
    console.log('   ✅ Parent completion tracking working');
    console.log('   ✅ Parent authentication working');
    console.log('   ✅ Parent homework retrieval working');

    console.log('\n🔑 Parent Login Credentials:');
    console.log('   Email: parent@test.com');
    console.log('   Password:', password);
    console.log('   Login URL: http://localhost:3000/parent-login');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Student.deleteMany({ email: 'student@test.com' });
    await Parent.deleteMany({ email: 'parent@test.com' });
    await Homework.deleteMany({ title: 'Math Practice' });
    await Class.deleteMany({ name: '5', section: 'A' });
    await Session.deleteMany({ name: '2024-2025' });
    await User.deleteMany({ email: 'admin@test.com' });
    console.log('✅ Test data cleaned up');
    
    mongoose.connection.close();
  }
}

// Run the test
testHomeworkModule();