const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupCredentials() {
  console.log('🔧 Setting up working credentials...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('✅ Connected to MongoDB');

    const User = require('./backend/models/User');
    const Teacher = require('./backend/models/Teacher');

    // Clear existing test users
    console.log('\n🧹 Clearing existing test users...');
    await User.deleteMany({ email: { $in: ['admin@school.com', 'teacher@school.com'] } });
    await Teacher.deleteMany({ email: { $in: ['teacher@school.com'] } });
    console.log('✅ Test users cleared');

    // Create admin user
    console.log('\n👨‍💼 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@school.com',
      password: adminPassword,
      role: 'admin',
      phone: '1234567890',
      address: 'Admin Address',
      isActive: true
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Create teacher user
    console.log('\n👨‍🏫 Creating teacher user...');
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const teacherUser = await User.create({
      name: 'Teacher User',
      email: 'teacher@school.com',
      password: teacherPassword,
      role: 'teacher',
      phone: '0987654321',
      address: 'Teacher Address',
      isActive: true
    });
    console.log('✅ Teacher user created:', teacherUser.email);

    // Create teacher profile
    console.log('\n📋 Creating teacher profile...');
    const teacherProfile = await Teacher.create({
      user: teacherUser._id,
      name: 'Teacher User',
      email: 'teacher@school.com',
      phone: '0987654321',
      designation: 'TGT',
      subjects: ['Mathematics', 'Science'],
      qualification: {
        degree: 'B.Tech',
        institution: 'Test University',
        yearOfCompletion: 2020
      },
      experience: {
        years: 3,
        previousSchools: ['Previous School']
      },
      salary: 50000,
      joiningDate: new Date(),
      contactInfo: {
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '1122334455',
          relationship: 'Spouse'
        }
      },
      isActive: true
    });
    console.log('✅ Teacher profile created');

    console.log('\n🎉 Credentials setup completed!');
    console.log('\n📋 Working Credentials:');
    console.log('\n👨‍💼 Admin:');
    console.log('Email: admin@school.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    console.log('\n👨‍🏫 Teacher:');
    console.log('Email: teacher@school.com');
    console.log('Password: teacher123');
    console.log('Role: teacher');

    console.log('\n🧪 You can now test teacher login with these credentials!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

setupCredentials().catch(console.error);