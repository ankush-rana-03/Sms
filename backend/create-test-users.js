const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');

    // Test users data
    const testUsers = [
      {
        name: "Admin User",
        email: "admin@school.com",
        password: "password123",
        role: "admin",
        phone: "1234567890",
        address: "123 Admin St",
        isActive: true,
        emailVerified: true
      },
      {
        name: "Teacher User",
        email: "teacher@school.com",
        password: "password123",
        role: "teacher",
        phone: "1234567891",
        address: "456 Teacher St",
        isActive: true,
        emailVerified: true
      },
      {
        name: "Parent User",
        email: "parent@school.com",
        password: "password123",
        role: "parent",
        phone: "1234567893",
        address: "321 Parent St",
        isActive: true,
        emailVerified: true
      }
    ];

    console.log('Creating test users...');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create new user
      const user = await User.create(userData);
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 Admin:');
    console.log('   Email: admin@school.com');
    console.log('   Password: password123');
    console.log('   Role: admin');
    console.log('');
    console.log('👩‍🏫 Teacher:');
    console.log('   Email: teacher@school.com');
    console.log('   Password: password123');
    console.log('   Role: teacher');
    console.log('');
    console.log('👨‍👩‍👧‍👦 Parent:');
    console.log('   Email: parent@school.com');
    console.log('   Password: password123');
    console.log('   Role: parent');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUsers();