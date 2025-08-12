const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ankushrana830:ankush45@school.mkq8tjp.mongodb.net/?retryWrites=true&w=majority&appName=school';

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the User model
    const User = require('./backend/models/User');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@school.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Name:', existingAdmin.name);
      console.log('Is Active:', existingAdmin.isActive);
      
      // Check if password needs to be reset
      if (existingAdmin.role === 'admin') {
        console.log('\nAdmin user is active and ready to use.');
        console.log('If you need to reset the password, you can do so through the application.');
      }
    } else {
      console.log('Creating new admin user...');
      
      // Create admin user
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
        phone: '1234567890',
        address: '123 Admin St',
        isActive: true,
        emailVerified: true
      });
      
      console.log('Admin user created successfully:');
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('Name:', adminUser.name);
      console.log('Password: admin123');
    }

    // List all users in the system
    console.log('\n=== All Users in System ===');
    const allUsers = await User.find({}).select('name email role isActive');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createAdminUser();