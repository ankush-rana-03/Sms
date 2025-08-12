const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://ankushrana830:ankush45@school.mkq8tjp.mongodb.net/?retryWrites=true&w=majority&appName=school';

async function createSimpleAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 30000,
    });
    console.log('Connected to MongoDB');
    
    // Create a simple user document directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@school.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Name:', existingAdmin.name);
      console.log('Is Active:', existingAdmin.isActive);
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user
    const adminUser = {
      name: 'Admin User',
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'admin',
      phone: '1234567890',
      address: '123 Admin St',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(adminUser);
    console.log('Admin user created successfully!');
    console.log('User ID:', result.insertedId);
    console.log('Email: admin@school.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.message.includes('buffering timed out')) {
      console.log('\nMongoDB Connection Issue:');
      console.log('The MongoDB Atlas cluster might be hibernating or there are network issues.');
      console.log('\nSolutions to try:');
      console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('2. The cluster might be hibernating - try accessing it from MongoDB Atlas dashboard');
      console.log('3. Check your network connectivity');
      console.log('4. Try using the deployed backend at https://sms-38ap.onrender.com');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

createSimpleAdmin();