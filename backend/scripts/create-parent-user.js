const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');

async function createParentUser() {
  const email = 'parent@school.com';
  const password = 'password123';
  const name = 'Parent User';
  const phone = '9999999999';

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';
  console.log('Connecting to MongoDB:', mongoUri.replace(/:\/\/.+@/, '://****@'));
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Create or update parent user
    let user = await User.findOne({ email });
    if (user) {
      console.log('Parent user already exists. Updating password and ensuring role...');
      user.password = password;
      user.role = 'parent';
      user.isActive = true;
      user.phone = phone;
      await user.save();
      console.log('✅ Parent user updated');
    } else {
      console.log('Creating new parent user...');
      user = await User.create({
        name,
        email,
        password,
        role: 'parent',
        phone,
        address: 'Parent Address',
        isActive: true
      });
      console.log('✅ Parent user created');
    }

    // Create a test student for this parent
    const testStudent = await Student.findOne({ parentPhone: phone });
    if (!testStudent) {
      console.log('Creating test student for parent...');
      await Student.create({
        name: 'Test Child',
        email: 'child@test.com',
        phone: '8888888888',
        address: 'Child Address',
        dateOfBirth: '2015-01-01',
        grade: '4',
        section: 'A',
        rollNumber: '001',
        gender: 'male',
        bloodGroup: 'A+',
        parentName: name,
        parentPhone: phone,
        currentSession: '2024-2025',
        pendingApproval: false
      });
      console.log('✅ Test student created for parent');
    } else {
      console.log('✅ Test student already exists for parent');
    }

    console.log('\n=== PARENT CREDENTIALS ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', 'parent');
    console.log('Phone:', phone);
    console.log('========================\n');

  } catch (err) {
    console.error('Failed to create parent user:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createParentUser().catch((e) => { console.error(e); process.exit(1); });
