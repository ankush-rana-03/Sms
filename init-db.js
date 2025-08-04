const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Teacher = require('./backend/models/Teacher');

async function initDatabase() {
  console.log('🗄️ Initializing Database...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    console.log('\n🧹 Clearing existing test data...');
    await User.deleteMany({ email: { $in: ['admin@school.com', 'testteacher@school.com'] } });
    await Teacher.deleteMany({ email: { $in: ['testteacher@school.com'] } });
    console.log('✅ Test data cleared');

    // Create admin user
    console.log('\n👨‍💼 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@school.com',
      password: adminPassword,
      role: 'admin',
      phone: '1234567890',
      address: 'Test Address',
      isActive: true
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Create teacher user
    console.log('\n👨‍🏫 Creating teacher user...');
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const teacherUser = await User.create({
      name: 'Test Teacher',
      email: 'testteacher@school.com',
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
      name: 'Test Teacher',
      email: 'testteacher@school.com',
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

    console.log('\n🎉 Database initialization completed!');
    console.log('\n📋 Test Credentials:');
    console.log('\n👨‍💼 Admin:');
    console.log('Email: admin@school.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    console.log('\n👨‍🏫 Teacher:');
    console.log('Email: testteacher@school.com');
    console.log('Password: teacher123');
    console.log('Role: teacher');

    console.log('\n🧪 You can now test teacher login with these credentials!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

initDatabase().catch(console.error);