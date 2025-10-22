const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Student = require('../models/Student');
const Parent = require('../models/Parent');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function showParentCredentials() {
  try {
    console.log('🔍 Showing Parent Credentials for All Students...\n');

    // Get all students with parent information
    const students = await Student.find({}).populate('parent', 'name email');
    
    console.log(`📊 Found ${students.length} students with parent accounts\n`);

    if (students.length === 0) {
      console.log('❌ No students found with parent accounts');
      return;
    }

    // Display credentials in a table format
    console.log('┌─────────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                                PARENT CREDENTIALS                                      │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────┤');
    console.log('│ Student Name          │ Parent Name        │ Parent Email                    │ Password │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────┤');

    students.forEach((student, index) => {
      const studentName = student.name.padEnd(20).substring(0, 20);
      const parentName = student.parent?.name?.padEnd(18).substring(0, 18) || 'N/A'.padEnd(18);
      const parentEmail = student.parent?.email?.padEnd(30).substring(0, 30) || 'N/A'.padEnd(30);
      const password = 'parent123'.padEnd(8);

      console.log(`│ ${studentName} │ ${parentName} │ ${parentEmail} │ ${password} │`);
    });

    console.log('└─────────────────────────────────────────────────────────────────────────────────────────┘');

    console.log('\n📝 Login Instructions:');
    console.log('1. Go to: http://localhost:3000/parent-login');
    console.log('2. Use any parent email from the table above');
    console.log('3. Password for all parents: parent123');
    console.log('\n🎯 Parents can:');
    console.log('• View their child\'s homework assignments');
    console.log('• Mark homework as half complete or fully complete');
    console.log('• Add comments and notes');
    console.log('• Track homework progress');

  } catch (error) {
    console.error('❌ Error showing credentials:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
showParentCredentials();