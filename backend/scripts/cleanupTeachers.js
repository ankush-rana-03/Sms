const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const cleanupTeachers = async () => {
  try {
    console.log('=== Starting Teacher Data Cleanup ===');
    
    // Find all teachers
    const teachers = await Teacher.find({});
    console.log(`Found ${teachers.length} teachers in database`);
    
    // Remove teachers with dummy data (you can customize this logic)
    const teachersToRemove = teachers.filter(teacher => {
      // Remove teachers with common dummy names or patterns
      const dummyPatterns = [
        /^Dr\. Sarah Johnson$/i,
        /^Mr\. Robert Smith$/i,
        /^Ms\. Emily Davis$/i,
        /^John Doe$/i,
        /^Jane Doe$/i,
        /^Test Teacher$/i,
        /^Dummy Teacher$/i,
        /^Sample Teacher$/i
      ];
      
      return dummyPatterns.some(pattern => pattern.test(teacher.name)) ||
             teacher.email.includes('test') ||
             teacher.email.includes('dummy') ||
             teacher.email.includes('sample') ||
             teacher.teacherId.includes('TEST') ||
             teacher.teacherId.includes('DUMMY');
    });
    
    console.log(`Found ${teachersToRemove.length} teachers with dummy data to remove`);
    
    if (teachersToRemove.length > 0) {
      // Remove associated user accounts
      const userIds = teachersToRemove.map(teacher => teacher.user);
      await User.deleteMany({ _id: { $in: userIds } });
      console.log(`Removed ${userIds.length} associated user accounts`);
      
      // Remove teacher profiles
      const teacherIds = teachersToRemove.map(teacher => teacher._id);
      await Teacher.deleteMany({ _id: { $in: teacherIds } });
      console.log(`Removed ${teacherIds.length} teacher profiles`);
      
      console.log('Dummy teacher data cleanup completed successfully');
    } else {
      console.log('No dummy teacher data found to remove');
    }
    
    // Show remaining teachers
    const remainingTeachers = await Teacher.find({});
    console.log(`Remaining teachers: ${remainingTeachers.length}`);
    
    if (remainingTeachers.length > 0) {
      console.log('Remaining teachers:');
      remainingTeachers.forEach(teacher => {
        console.log(`- ${teacher.name} (${teacher.teacherId}) - ${teacher.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the cleanup
cleanupTeachers();