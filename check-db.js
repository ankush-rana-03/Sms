const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  console.log('🔍 Checking Database Connection...\n');
  
  try {
    console.log('📡 Connecting to MongoDB...');
    console.log('🔗 URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully!');

    // Check if we can access the database
    console.log('\n📊 Checking database collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));

    // Check if users collection exists and has data
    if (collections.some(c => c.name === 'users')) {
      console.log('\n👥 Checking users collection...');
      const User = require('./backend/models/User');
      const userCount = await User.countDocuments();
      console.log('📊 Total users in database:', userCount);
      
      if (userCount > 0) {
        const users = await User.find().select('email role isActive').limit(5);
        console.log('👤 Sample users:');
        users.forEach(user => {
          console.log(`  - ${user.email} (${user.role}) - Active: ${user.isActive}`);
        });
      }
    }

    // Check if teachers collection exists and has data
    if (collections.some(c => c.name === 'teachers')) {
      console.log('\n👨‍🏫 Checking teachers collection...');
      const Teacher = require('./backend/models/Teacher');
      const teacherCount = await Teacher.countDocuments();
      console.log('📊 Total teachers in database:', teacherCount);
      
      if (teacherCount > 0) {
        const teachers = await Teacher.find().select('email designation').limit(5);
        console.log('👤 Sample teachers:');
        teachers.forEach(teacher => {
          console.log(`  - ${teacher.email} (${teacher.designation})`);
        });
      }
    }

    console.log('\n✅ Database check completed successfully!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Issue: Cannot connect to MongoDB');
      console.log('🔧 Solutions:');
      console.log('1. Check if MongoDB is running');
      console.log('2. Verify MONGODB_URI in .env file');
      console.log('3. Check network connectivity');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n💡 Issue: MongoDB authentication failed');
      console.log('🔧 Solutions:');
      console.log('1. Check username/password in MONGODB_URI');
      console.log('2. Verify database permissions');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Issue: MongoDB host not found');
      console.log('🔧 Solutions:');
      console.log('1. Check MONGODB_URI hostname');
      console.log('2. Verify DNS resolution');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

checkDatabase().catch(console.error);