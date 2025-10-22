const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
require('dotenv').config();

// Simple password generator
function generateSimplePassword() {
  const adjectives = ['happy', 'bright', 'smart', 'kind', 'wise', 'brave', 'calm', 'cool'];
  const nouns = ['star', 'moon', 'sun', 'tree', 'bird', 'fish', 'cat', 'dog'];
  const numbers = Math.floor(Math.random() * 900) + 100; // 100-999
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
}

async function createParentAccounts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all students with parent emails
    const students = await Student.find({ 
      parentEmail: { $exists: true, $ne: null } 
    }).lean();

    console.log(`\nFound ${students.length} students with parent emails`);

    const results = {
      created: 0,
      alreadyExists: 0,
      errors: 0,
      details: []
    };

    for (const student of students) {
      try {
        console.log(`\nProcessing student: ${student.name}`);
        console.log(`Parent: ${student.parentName}`);
        console.log(`Parent Email: ${student.parentEmail}`);

        // Check if parent user already exists
        const existingParent = await User.findOne({ email: student.parentEmail });
        
        if (existingParent) {
          console.log(`Parent account already exists for ${student.parentEmail}`);
          results.alreadyExists++;
          results.details.push({
            student: student.name,
            parentEmail: student.parentEmail,
            status: 'already_exists',
            userId: existingParent._id
          });
          
          // Still link the student to existing parent
          await Student.findByIdAndUpdate(student._id, { parent: existingParent._id });
          console.log(`Linked student to existing parent account`);
          continue;
        }

        // Generate simple password
        const password = generateSimplePassword();
        console.log(`Generated password: ${password}`);

        // Create parent user account
        const parentUser = await User.create({
          name: student.parentName,
          email: student.parentEmail,
          password: password,
          role: 'parent',
          phone: student.parentPhone,
          address: student.address || 'Not provided',
          isActive: true
        });

        console.log(`Created parent account: ${parentUser.email}`);
        results.created++;
        results.details.push({
          student: student.name,
          parentEmail: student.parentEmail,
          password: password,
          status: 'created',
          userId: parentUser._id
        });

        // Update student record to link to parent user
        await Student.findByIdAndUpdate(student._id, { parent: parentUser._id });
        console.log(`Linked student to parent account`);

      } catch (error) {
        console.error(`Error creating parent account for ${student.name}:`, error.message);
        results.errors++;
        results.details.push({
          student: student.name,
          parentEmail: student.parentEmail,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Created: ${results.created}`);
    console.log(`Already exists: ${results.alreadyExists}`);
    console.log(`Errors: ${results.errors}`);

    console.log('\n=== DETAILED RESULTS ===');
    results.details.forEach((detail, index) => {
      console.log(`\n${index + 1}. Student: ${detail.student}`);
      console.log(`   Parent Email: ${detail.parentEmail}`);
      console.log(`   Status: ${detail.status}`);
      if (detail.password) {
        console.log(`   Password: ${detail.password}`);
      }
      if (detail.userId) {
        console.log(`   User ID: ${detail.userId}`);
      }
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

createParentAccounts();