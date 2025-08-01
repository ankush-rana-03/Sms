const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test users exist
    const users = await User.find({});
    console.log(`Found ${users.length} users in database:`);
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

    // Test login with admin user
    const adminUser = await User.findOne({ email: 'admin@school.com' }).select('+password');
    if (adminUser) {
      console.log('\nTesting admin login...');
      const isMatch = await adminUser.matchPassword('password123');
      console.log('Password match:', isMatch);
      
      if (isMatch) {
        const token = adminUser.getSignedJwtToken();
        console.log('JWT Token generated:', token.substring(0, 50) + '...');
      }
    } else {
      console.log('\nAdmin user not found. Creating test users...');
    }
    
    // Delete existing users and recreate with correct passwords
    console.log('\nRecreating test users with correct passwords...');
    await User.deleteMany({});
    
    // Create test users
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@school.com',
        password: 'password123',
        role: 'admin',
        phone: '1234567890',
        address: '123 Admin St',
        isActive: true
      },
      {
        name: 'Teacher User',
        email: 'teacher@school.com',
        password: 'password123',
        role: 'teacher',
        phone: '1234567891',
        address: '456 Teacher St',
        isActive: true
      },
      {
        name: 'Student User',
        email: 'student@school.com',
        password: 'password123',
        role: 'student',
        phone: '1234567892',
        address: '789 Student St',
        isActive: true
      },
      {
        name: 'Parent User',
        email: 'parent@school.com',
        password: 'password123',
        role: 'parent',
        phone: '1234567893',
        address: '321 Parent St',
        isActive: true
      }
    ];

    for (const userData of testUsers) {
      const user = await User.create(userData);
      console.log(`Created user: ${user.name} (${user.email})`);
    }
    
    // Test the admin user again
    const newAdminUser = await User.findOne({ email: 'admin@school.com' }).select('+password');
    console.log('\nTesting new admin login...');
    const isMatch = await newAdminUser.matchPassword('password123');
    console.log('Password match:', isMatch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAuth();