const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://ankushrana830:ankush45@school.mkq8tjp.mongodb.net/?retryWrites=true&w=majority&appName=school';

async function resetAdminPassword() {
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
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find the admin user
    const adminUser = await usersCollection.findOne({ email: 'admin@school.com' });
    
    if (!adminUser) {
      console.log('Admin user not found. Creating new one...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user
      const newAdminUser = {
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
      
      const result = await usersCollection.insertOne(newAdminUser);
      console.log('New admin user created with ID:', result.insertedId);
    } else {
      console.log('Admin user found. Resetting password...');
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Update password
      const result = await usersCollection.updateOne(
        { email: 'admin@school.com' },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('Password reset result:', result);
      console.log('Modified count:', result.modifiedCount);
    }
    
    // Verify the user exists and show details
    const updatedAdmin = await usersCollection.findOne({ email: 'admin@school.com' });
    console.log('\nUpdated admin user:');
    console.log('Email:', updatedAdmin.email);
    console.log('Role:', updatedAdmin.role);
    console.log('Name:', updatedAdmin.name);
    console.log('Is Active:', updatedAdmin.isActive);
    console.log('Password Hash Length:', updatedAdmin.password ? updatedAdmin.password.length : 'No password');
    
    // Test password verification
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, updatedAdmin.password);
    console.log('Password verification test:', isMatch ? '✅ PASS' : '❌ FAIL');
    
    console.log('\nLogin credentials:');
    console.log('Email: admin@school.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

resetAdminPassword();