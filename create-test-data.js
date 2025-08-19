const mongoose = require('mongoose');
require('./backend/models/Student');
require('./backend/models/Class');
require('./backend/models/Session');
require('./backend/models/User');

// Use the production MongoDB URI for testing
const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster0.ib5bv.mongodb.net/school_management?retryWrites=true&w=majority';

async function createTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Student = mongoose.model('Student');
    const Class = mongoose.model('Class');
    const Session = mongoose.model('Session');
    const User = mongoose.model('User');

    // Check if session exists
    let currentSession = await Session.findOne({ isCurrent: true });
    if (!currentSession) {
      console.log('Creating current session...');
      currentSession = await Session.create({
        name: '2024-2025',
        academicYear: '2024-2025',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        isCurrent: true
      });
      console.log('Session created:', currentSession.name);
    } else {
      console.log('Current session found:', currentSession.name);
    }

    // Check if classes exist
    let classCount = await Class.countDocuments({ isActive: true });
    if (classCount === 0) {
      console.log('Creating test classes...');
      const classes = [
        { name: '10', section: 'A', academicYear: '2024-2025', session: currentSession.name, capacity: 30 },
        { name: '10', section: 'B', academicYear: '2024-2025', session: currentSession.name, capacity: 30 },
        { name: '9', section: 'A', academicYear: '2024-2025', session: currentSession.name, capacity: 30 },
        { name: '9', section: 'B', academicYear: '2024-2025', session: currentSession.name, capacity: 30 },
      ];
      
      for (const classData of classes) {
        await Class.create(classData);
        console.log(`Created class: ${classData.name}-${classData.section}`);
      }
    } else {
      console.log(`Found ${classCount} existing classes`);
    }

    // Check if students exist
    let studentCount = await Student.countDocuments({ deletedAt: null });
    if (studentCount === 0) {
      console.log('Creating test students...');
      const students = [
        // Class 10A
        { name: 'John Doe', email: 'john@example.com', rollNumber: '001', grade: '10', section: 'A', phone: '9876543210', parentName: 'Mr. Doe', parentPhone: '+919876543210', address: '123 Main St', dateOfBirth: '2008-01-15', gender: 'male', bloodGroup: 'O+', currentSession: currentSession.name },
        { name: 'Jane Smith', email: 'jane@example.com', rollNumber: '002', grade: '10', section: 'A', phone: '9876543211', parentName: 'Mrs. Smith', parentPhone: '+919876543211', address: '456 Oak Ave', dateOfBirth: '2008-02-20', gender: 'female', bloodGroup: 'A+', currentSession: currentSession.name },
        { name: 'Mike Johnson', email: 'mike@example.com', rollNumber: '003', grade: '10', section: 'A', phone: '9876543212', parentName: 'Mr. Johnson', parentPhone: '+919876543212', address: '789 Pine St', dateOfBirth: '2008-03-10', gender: 'male', bloodGroup: 'B+', currentSession: currentSession.name },
        { name: 'Sarah Wilson', email: 'sarah@example.com', rollNumber: '004', grade: '10', section: 'A', phone: '9876543213', parentName: 'Mrs. Wilson', parentPhone: '+919876543213', address: '321 Elm St', dateOfBirth: '2008-04-05', gender: 'female', bloodGroup: 'AB+', currentSession: currentSession.name },
        
        // Class 10B
        { name: 'David Brown', email: 'david@example.com', rollNumber: '001', grade: '10', section: 'B', phone: '9876543214', parentName: 'Mr. Brown', parentPhone: '+919876543214', address: '654 Maple Ave', dateOfBirth: '2008-05-12', gender: 'male', bloodGroup: 'O-', currentSession: currentSession.name },
        { name: 'Lisa Davis', email: 'lisa@example.com', rollNumber: '002', grade: '10', section: 'B', phone: '9876543215', parentName: 'Mrs. Davis', parentPhone: '+919876543215', address: '987 Cedar St', dateOfBirth: '2008-06-18', gender: 'female', bloodGroup: 'A-', currentSession: currentSession.name },
        
        // Class 9A
        { name: 'Tom Anderson', email: 'tom@example.com', rollNumber: '001', grade: '9', section: 'A', phone: '9876543216', parentName: 'Mr. Anderson', parentPhone: '+919876543216', address: '147 Birch St', dateOfBirth: '2009-01-25', gender: 'male', bloodGroup: 'B-', currentSession: currentSession.name },
        { name: 'Emma White', email: 'emma@example.com', rollNumber: '002', grade: '9', section: 'A', phone: '9876543217', parentName: 'Mrs. White', parentPhone: '+919876543217', address: '258 Spruce Ave', dateOfBirth: '2009-02-14', gender: 'female', bloodGroup: 'AB-', currentSession: currentSession.name },
      ];

      for (const studentData of students) {
        await Student.create(studentData);
        console.log(`Created student: ${studentData.name} (${studentData.grade}-${studentData.section})`);
      }
    } else {
      console.log(`Found ${studentCount} existing students`);
    }

    // Check if admin user exists
    let adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('Creating admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await User.create({
        name: 'Admin User',
        email: 'admin@school.com',
        password: hashedPassword,
        role: 'admin',
        phone: '9999999999',
        address: 'School Address',
        isActive: true,
        emailVerified: true
      });
      console.log('Admin user created with email: admin@school.com, password: admin123');
    } else {
      console.log(`Found ${adminCount} existing admin users`);
    }

    console.log('\nTest data setup complete!');
    console.log('You can now login with:');
    console.log('Email: admin@school.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();