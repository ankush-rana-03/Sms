const mongoose = require('mongoose');

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');

  try {
    console.log('📡 Attempting to connect to MongoDB...');
    console.log('   URI: mongodb://localhost:27017/school_management');
    
    await mongoose.connect('mongodb://localhost:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connection successful!');
    
    // Test if we can perform database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.log('❌ MongoDB connection failed!');
    console.log('   Error:', error.message);
    console.log('\n💡 This explains why teacher creation is failing with 500 error.');
    console.log('\n🔧 Solutions:');
    console.log('   1. Install MongoDB locally');
    console.log('   2. Use a cloud MongoDB instance (MongoDB Atlas)');
    console.log('   3. Set MONGODB_URI environment variable');
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed.');
    }
  }
}

testMongoDBConnection();