const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Check existing users
async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...\n');
    
    const User = require('./backend/models/User');
    const Teacher = require('./backend/models/Teacher');
    
    // Check all users
    const users = await User.find({}).select('name email role isActive');
    console.log('📋 All Users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
    console.log('\n📋 All Teachers:');
    const teachers = await Teacher.find({}).select('name email designation isActive');
    teachers.forEach(teacher => {
      console.log(`  - ${teacher.name} (${teacher.email}) - Designation: ${teacher.designation} - Active: ${teacher.isActive}`);
    });
    
    // Check for admin users specifically
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\n👑 Admin Users: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email})`);
    });
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️ No admin users found! You need to create an admin user first.');
      console.log('To create an admin user, you can:');
      console.log('1. Use the registration endpoint');
      console.log('2. Create directly in the database');
      console.log('3. Use the seed script if available');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
}

// Create a test admin user if none exists
async function createTestAdmin() {
  try {
    const User = require('./backend/models/User');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }
    
    console.log('🔧 Creating test admin user...');
    
    // Create admin user
    const adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      phone: '1234567890',
      address: 'Test Address',
      isActive: true
    });
    
    console.log('✅ Test admin created:', adminUser.email);
    console.log('📝 Login credentials:');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

// Main function
async function main() {
  await connectDB();
  
  console.log('\n' + '='.repeat(50));
  await checkUsers();
  
  console.log('\n' + '='.repeat(50));
  await createTestAdmin();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Database check completed!');
  
  mongoose.connection.close();
}

main();