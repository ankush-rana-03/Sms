const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { sendEmail } = require('../utils/sendEmail');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateExistingStudents() {
  try {
    console.log('🔄 Migrating existing students to parent system...\n');

    // 1. Find all students without parentEmail field
    const studentsWithoutParentEmail = await Student.find({
      $or: [
        { parentEmail: { $exists: false } },
        { parentEmail: null },
        { parentEmail: '' }
      ]
    });

    console.log(`📊 Found ${studentsWithoutParentEmail.length} students without parent email`);

    if (studentsWithoutParentEmail.length === 0) {
      console.log('✅ All students already have parent email. Migration not needed.');
      return;
    }

    // 2. Process each student
    let migratedCount = 0;
    let skippedCount = 0;

    for (const student of studentsWithoutParentEmail) {
      try {
        console.log(`\n👤 Processing student: ${student.name} (${student.email})`);

        // Generate simple parent email
        const studentName = student.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const parentName = student.parentName.toLowerCase().replace(/[^a-z0-9]/g, '');
        parentEmail = `${parentName}${studentName}@parent.com`;

        console.log(`   📧 Generated parent email: ${parentEmail}`);

        // Check if parent already exists
        let parent = await Parent.findOne({ email: parentEmail });
        
        if (parent) {
          console.log(`   ✅ Parent already exists, adding student to existing parent`);
          if (!parent.children.includes(student._id)) {
            parent.children.push(student._id);
            await parent.save();
          }
        } else {
          // Generate unique credentials
          const { parentId, password } = Parent.generateCredentials();

          // Create new parent
          parent = new Parent({
            name: student.parentName,
            email: parentEmail,
            password: password,
            phone: student.parentPhone,
            address: student.address,
            children: [student._id],
            credentialsGenerated: true,
            credentialsGeneratedAt: new Date()
          });

          await parent.save();
          console.log(`   ✅ Parent created with ID: ${parentId}`);
          console.log(`   🔑 Password: ${password}`);
        }

        // Update student with parent email and parent reference
        student.parentEmail = parentEmail;
        student.parent = parent._id;
        await student.save();

        console.log(`   ✅ Student updated with parent email and reference`);

        // Send credentials email
        try {
          const emailSubject = 'Parent Portal Access Credentials - Existing Student';
          const emailBody = `
            <h2>Parent Portal Access Now Available</h2>
            <p>Dear ${student.parentName},</p>
            <p>We have set up a parent portal account for you to access information about your child ${student.name} who is already enrolled in our school.</p>
            
            <h3>Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${parentEmail}</p>
            <p><strong>Password:</strong> ${parent.password}</p>
            
            <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
            
            <p>You can access the parent portal at: <a href="${process.env.FRONTEND_URL}/parent-login">Parent Portal Login</a></p>
            
            <p>Through the parent portal, you can:</p>
            <ul>
              <li>View your child's homework assignments</li>
              <li>Track homework completion progress</li>
              <li>Add comments and notes</li>
              <li>View academic information</li>
            </ul>
            
            <p>Best regards,<br>School Administration</p>
          `;

          await sendEmail({
            email: parentEmail,
            subject: emailSubject,
            message: emailBody
          });
          
          console.log(`   📧 Credentials sent via email to: ${parentEmail}`);
        } catch (emailError) {
          console.error(`   ❌ Email sending failed: ${emailError.message}`);
          // Don't fail the migration if email fails
        }

        migratedCount++;

      } catch (error) {
        console.error(`   ❌ Error processing student ${student.name}: ${error.message}`);
        skippedCount++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} students`);
    console.log(`   ⚠️  Skipped due to errors: ${skippedCount} students`);
    console.log(`   📧 Total parent accounts created/updated: ${migratedCount}`);

    // 3. Verify migration
    console.log('\n🔍 Verifying migration...');
    const studentsWithParentEmail = await Student.countDocuments({
      parentEmail: { $exists: true, $ne: null, $ne: '' }
    });
    const totalStudents = await Student.countDocuments();
    
    console.log(`📊 Verification Results:`);
    console.log(`   Total students: ${totalStudents}`);
    console.log(`   Students with parent email: ${studentsWithParentEmail}`);
    console.log(`   Migration success rate: ${((studentsWithParentEmail / totalStudents) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
migrateExistingStudents();