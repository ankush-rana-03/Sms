const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Generate simple email from parent name
function generateSimpleEmail(parentName) {
  // Clean parent name for email
  const cleanName = parentName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
  
  return `${cleanName}@gmail.com`;
}

async function updateParentCredentials() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all students with parent information
    const students = await Student.find({ parentName: { $exists: true } }).lean();
    console.log(`\nFound ${students.length} students with parent information`);

    const results = {
      updated: 0,
      created: 0,
      errors: 0,
      details: []
    };

    // Hash the common password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Hashed password for password123');

    for (const student of students) {
      try {
        console.log(`\nProcessing student: ${student.name}`);
        console.log(`Parent: ${student.parentName}`);

        // Generate simple email
        const simpleEmail = generateSimpleEmail(student.parentName);
        console.log(`Generated email: ${simpleEmail}`);

        // Check if parent user already exists with this email
        let parentUser = await User.findOne({ email: simpleEmail });
        
        if (parentUser) {
          console.log(`Parent account already exists for ${simpleEmail}`);
          // Update password to password123
          parentUser.password = hashedPassword;
          await parentUser.save();
          console.log(`Updated password for existing parent account`);
          results.updated++;
        } else {
          // Create new parent user
          parentUser = await User.create({
            name: student.parentName,
            email: simpleEmail,
            password: hashedPassword,
            role: 'parent',
            phone: student.parentPhone,
            address: student.address || 'Not provided',
            isActive: true
          });
          console.log(`Created new parent account: ${simpleEmail}`);
          results.created++;
        }

        // Update student record with new parent email and link
        await Student.findByIdAndUpdate(student._id, {
          parentEmail: simpleEmail,
          parent: parentUser._id
        });

        console.log(`Updated student record with new parent email and link`);

        results.details.push({
          student: student.name,
          parentName: student.parentName,
          oldEmail: student.parentEmail || 'None',
          newEmail: simpleEmail,
          password: 'password123',
          status: 'success'
        });

      } catch (error) {
        console.error(`Error processing student ${student.name}:`, error.message);
        results.errors++;
        results.details.push({
          student: student.name,
          parentName: student.parentName,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Updated existing accounts: ${results.updated}`);
    console.log(`Created new accounts: ${results.created}`);
    console.log(`Errors: ${results.errors}`);

    console.log('\n=== DETAILED RESULTS ===');
    results.details.forEach((detail, index) => {
      console.log(`\n${index + 1}. Student: ${detail.student}`);
      console.log(`   Parent: ${detail.parentName}`);
      console.log(`   Old Email: ${detail.oldEmail}`);
      console.log(`   New Email: ${detail.newEmail}`);
      console.log(`   Password: ${detail.password || 'N/A'}`);
      console.log(`   Status: ${detail.status}`);
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
    });

    // Show final parent credentials
    console.log('\n=== FINAL PARENT CREDENTIALS ===');
    const allParents = await User.find({ role: 'parent' }).lean();
    allParents.forEach((parent, index) => {
      console.log(`\n${index + 1}. ${parent.name}`);
      console.log(`   Email: ${parent.email}`);
      console.log(`   Password: password123`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

updateParentCredentials();