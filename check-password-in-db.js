require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function checkPasswordInDB() {
  console.log('🔍 Checking Password in Database\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get User model
    const User = require('./backend/models/User');
    
    // Find the user
    const user = await User.findOne({ email: 'reset4@school.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found');
    console.log('Email:', user.email);
    console.log('Stored password hash:', user.password);
    
    // Test password comparison
    const testPassword = 'newresetpassword123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('Password matches:', isMatch);
    
    // Test with original password
    const originalPassword = '7J@l9f1fbY*i';
    const isOriginalMatch = await bcrypt.compare(originalPassword, user.password);
    console.log('Original password matches:', isOriginalMatch);
    
    // Test with User model's matchPassword method
    const modelMatch = await user.matchPassword(testPassword);
    console.log('Model matchPassword result:', modelMatch);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkPasswordInDB().catch(console.error);