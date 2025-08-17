const mongoose = require('mongoose');
require('dotenv').config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@school.com' });
    if (existingUser) {
      console.log('Test user already exists');
      mongoose.connection.close();
      return;
    }

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@school.com',
      password: 'test123',
      role: 'admin',
      phone: '1234567890',
      address: 'Test Address',
      isActive: true
    });

    console.log('Test user created successfully:', {
      id: testUser._id,
      email: testUser.email,
      role: testUser.role,
      isActive: testUser.isActive
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test user:', error);
    mongoose.connection.close();
  }
}

createTestUser();