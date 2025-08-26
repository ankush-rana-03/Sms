const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Generate a secure random password
const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * length));
  }
  return password;
};

const fixTeacherUserReferences = async () => {
  try {
    console.log('🔍 Checking for teachers with invalid user references...');
    
    // Find all teachers
    const allTeachers = await Teacher.find({});
    console.log(`Total teachers found: ${allTeachers.length}`);
    
    // Check each teacher's user reference
    const teachersToFix = [];
    
    for (const teacher of allTeachers) {
      if (teacher.user) {
        // Check if the referenced user actually exists
        const userExists = await User.findById(teacher.user);
        if (!userExists) {
          console.log(`❌ Teacher ${teacher.name} has invalid user reference: ${teacher.user}`);
          teachersToFix.push(teacher);
        } else {
          console.log(`✅ Teacher ${teacher.name} has valid user reference: ${teacher.user}`);
        }
      } else {
        console.log(`❌ Teacher ${teacher.name} has no user reference`);
        teachersToFix.push(teacher);
      }
    }
    
    if (teachersToFix.length === 0) {
      console.log('✅ All teachers have valid user references!');
      return;
    }
    
    console.log(`\n📝 Found ${teachersToFix.length} teachers that need fixing:`);
    
    for (const teacher of teachersToFix) {
      console.log(`\n🔧 Fixing teacher: ${teacher.name} (${teacher.email})`);
      console.log(`  Teacher ID: ${teacher._id}`);
      console.log(`  Current user field: ${teacher.user}`);
      
      // Check if a user with this email already exists
      let existingUser = await User.findOne({ email: teacher.email });
      console.log(`  Existing user check: ${existingUser ? existingUser._id : 'None found'}`);
      
      if (existingUser) {
        console.log(`  ✅ User already exists for ${teacher.email}, linking...`);
        // Link the existing user to the teacher
        const updateResult = await Teacher.findByIdAndUpdate(teacher._id, { user: existingUser._id });
        console.log(`  🔗 Update result:`, updateResult);
        console.log(`  🔗 Linked teacher to existing user: ${existingUser._id}`);
      } else {
        console.log(`  📝 Creating new user account for ${teacher.email}...`);
        
        // Generate a secure password
        const password = generatePassword();
        
        // Create user account
        const userData = {
          name: teacher.name,
          email: teacher.email,
          password: password,
          role: 'teacher',
          phone: teacher.phone || 'Not provided',
          address: 'Not provided',
          isActive: true
        };
        
        console.log(`  📝 User data to create:`, { ...userData, password: '[HIDDEN]' });
        
        const newUser = await User.create(userData);
        console.log(`  ✅ Created user account: ${newUser._id}`);
        
        // Link the user to the teacher
        const updateResult = await Teacher.findByIdAndUpdate(teacher._id, { user: newUser._id });
        console.log(`  🔗 Update result:`, updateResult);
        console.log(`  🔗 Linked teacher to new user: ${newUser._id}`);
        
        console.log(`  🔑 Temporary password: ${password}`);
        console.log(`  📧 Teacher should use this password to login: ${teacher.email}`);
      }
    }
    
    console.log('\n✅ All teachers have been fixed!');
    
    // Verify the fix
    const finalCheck = await Teacher.find({}).populate('user');
    console.log('\n🔍 Final verification:');
    finalCheck.forEach(t => {
      console.log(`  ${t.name}: ${t.user ? `✅ User ${t.user._id}` : '❌ Missing User'}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing teacher user references:', error);
  }
};

// Run the fix
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ankushrana830:ankush45@school.mkq8tjp.mongodb.net/?retryWrites=true&w=majority&appName=school';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('🚀 Connected to MongoDB');
      return fixTeacherUserReferences();
    })
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixTeacherUserReferences };