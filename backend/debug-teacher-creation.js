const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Test database connection and teacher creation step by step
async function debugTeacherCreation() {
  console.log('=== Debugging Teacher Creation ===\n');
  
  try {
    // Step 1: Test database connection
    console.log('1. Testing database connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // Step 2: Test User model creation
    console.log('\n2. Testing User model creation...');
    const password = 'testpassword123';
    const userData = {
      name: 'Test User',
      email: `test.user.${Date.now()}@school.com`,
      password: password,
      role: 'teacher',
      phone: '1234567890',
      address: 'Test Address' // This was missing!
    };
    
    try {
      const user = await User.create(userData);
      console.log('✅ User created successfully:', user._id);
      
      // Step 3: Test Teacher model creation
      console.log('\n3. Testing Teacher model creation...');
      const teacherData = {
        user: user._id,
        name: 'Test Teacher',
        email: `test.teacher.${Date.now()}@school.com`,
        phone: '1234567890',
        designation: 'TGT',
        subjects: ['Mathematics'],
        qualification: {
          degree: 'B.Ed',
          institution: 'Test University',
          yearOfCompletion: 2020
        },
        experience: {
          years: 3,
          previousSchools: ['Previous School']
        },
        joiningDate: new Date(),
        contactInfo: {
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '0987654321',
            relationship: 'Spouse'
          }
        }
      };
      
      try {
        const teacher = await Teacher.create(teacherData);
        console.log('✅ Teacher created successfully:', teacher._id);
        console.log('Teacher ID generated:', teacher.teacherId);
        
        // Step 4: Test population
        console.log('\n4. Testing population...');
        const populatedTeacher = await Teacher.findById(teacher._id)
          .populate('user', 'name email role isActive');
        console.log('✅ Population successful');
        console.log('Populated teacher:', {
          _id: populatedTeacher._id,
          teacherId: populatedTeacher.teacherId,
          name: populatedTeacher.name,
          user: populatedTeacher.user
        });
        
        // Cleanup
        await Teacher.findByIdAndDelete(teacher._id);
        await User.findByIdAndDelete(user._id);
        console.log('\n✅ Cleanup completed');
        
      } catch (teacherError) {
        console.log('❌ Teacher creation failed:', teacherError.message);
        if (teacherError.name === 'ValidationError') {
          console.log('Validation errors:', Object.values(teacherError.errors).map(err => err.message));
        }
        // Cleanup user
        await User.findByIdAndDelete(user._id);
      }
      
    } catch (userError) {
      console.log('❌ User creation failed:', userError.message);
      if (userError.name === 'ValidationError') {
        console.log('Validation errors:', Object.values(userError.errors).map(err => err.message));
      }
    }
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
  }
}

// Run the debug
debugTeacherCreation();