const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Teacher = require('./backend/models/Teacher');

async function setupAdminAndTestEmail() {
  console.log('🔧 Setting up Admin and Testing Email\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';
    console.log('🔗 MongoDB URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 60000, // 60 seconds
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 60000, // 60 seconds
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    console.log('\n👤 Checking for admin user...');
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user found:', existingAdmin.email);
      console.log('💡 You can use these credentials:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Password: (check your .env file or database)');
    } else {
      console.log('❌ No admin user found. Creating one...');
      
      // Create admin user
      const adminPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@school.com',
        password: hashedPassword,
        role: 'admin',
        phone: '1234567890',
        address: 'School Address',
        isActive: true
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@school.com');
      console.log('🔑 Password: admin123');
    }

    // Check email configuration
    console.log('\n📧 Checking email configuration...');
    const emailConfig = {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
      SCHOOL_NAME: process.env.SCHOOL_NAME,
      FRONTEND_URL: process.env.FRONTEND_URL
    };
    
    console.log('📋 Email Configuration:');
    Object.entries(emailConfig).forEach(([key, value]) => {
      const status = value ? '✅ Set' : '❌ Not set';
      const displayValue = key.includes('PASSWORD') ? (value ? '***' : 'Not set') : (value || 'Not set');
      console.log(`   ${key}: ${displayValue} ${status}`);
    });

    if (!emailConfig.EMAIL_USER || !emailConfig.EMAIL_PASSWORD) {
      console.log('\n⚠️  Email configuration is incomplete!');
      console.log('💡 To enable email notifications, set these environment variables:');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASSWORD=your-app-password');
      console.log('   SCHOOL_NAME=Your School Name');
      console.log('   FRONTEND_URL=https://your-frontend-url.com');
      console.log('\n📝 Note: For Gmail, you need to use an App Password, not your regular password.');
    } else {
      console.log('\n✅ Email configuration looks good!');
    }

    // Test email service
    console.log('\n🧪 Testing email service...');
    try {
      const emailService = require('./backend/services/emailService');
      
      // Test email service initialization
      console.log('✅ Email service loaded successfully');
      
      // Test email sending (this will fail if credentials are wrong, but won't crash)
      console.log('📧 Testing email sending...');
      const testEmailData = {
        name: 'Test Teacher',
        email: 'test@example.com',
        designation: 'TGT',
        teacherId: 'TEST001'
      };
      
      try {
        await emailService.sendAdminPasswordResetEmail(testEmailData, 'testpassword123');
        console.log('✅ Email service test successful');
      } catch (emailError) {
        console.log('❌ Email service test failed:', emailError.message);
        console.log('💡 This is expected if email credentials are not configured');
      }
      
    } catch (error) {
      console.log('❌ Email service test failed:', error.message);
    }

    // Check existing teachers
    console.log('\n👨‍🏫 Checking existing teachers...');
    const teachers = await Teacher.find().populate('user');
    console.log(`✅ Found ${teachers.length} teachers`);
    
    if (teachers.length > 0) {
      console.log('📋 Teacher list:');
      teachers.forEach((teacher, index) => {
        console.log(`   ${index + 1}. ${teacher.name} (${teacher.user.email}) - ${teacher.designation}`);
      });
    } else {
      console.log('📝 No teachers found. You can create teachers through the admin interface.');
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. If email is not configured, set up environment variables');
    console.log('2. Start the backend server: cd backend && npm start');
    console.log('3. Test password reset functionality');
    console.log('4. Check email inbox for notifications');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

setupAdminAndTestEmail().catch(console.error);