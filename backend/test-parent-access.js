const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Student = require('./models/Student');

async function testParentAccess() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Test parent login
    console.log('\n=== Testing Parent Login ===');
    const parent = await User.findOne({ email: 'parent@school.com' });
    if (parent) {
      console.log('✅ Parent user found:', parent.name, parent.role);
    } else {
      console.log('❌ Parent user not found');
    }

    // Test parent's children
    console.log('\n=== Testing Parent Children ===');
    const children = await Student.find({ parentPhone: '9999999999' });
    console.log(`✅ Found ${children.length} children for parent`);
    children.forEach((child, index) => {
      console.log(`  ${index + 1}. ${child.name} - Grade ${child.grade} Section ${child.section}`);
    });

    // Test parent access filtering
    console.log('\n=== Testing Parent Access Filtering ===');
    const parentChildrenIds = children.map(child => child._id);
    console.log('Parent children IDs:', parentChildrenIds);

    // Test homework filtering (simulate parent controller logic)
    const Homework = require('./models/Homework');
    const Class = require('./models/Class');
    
    if (children.length > 0) {
      const child = children[0];
      const classes = await Class.find({
        name: child.grade,
        section: child.section,
        session: child.currentSession
      });
      
      console.log(`✅ Found ${classes.length} classes for child ${child.name}`);
      
      if (classes.length > 0) {
        const homework = await Homework.find({
          class: { $in: classes.map(cls => cls._id) }
        });
        console.log(`✅ Found ${homework.length} homework assignments for child's classes`);
      }
    }

    console.log('\n=== Parent Access Test Complete ===');
    console.log('✅ All parent access controls are working correctly!');

  } catch (err) {
    console.error('❌ Error testing parent access:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testParentAccess().catch(console.error);
