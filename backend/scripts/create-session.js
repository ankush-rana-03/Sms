const mongoose = require('mongoose');
const Session = require('../models/Session');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check if there's already a current session
    const existingCurrentSession = await Session.findOne({ isCurrent: true });
    if (existingCurrentSession) {
      console.log('Current session already exists:', existingCurrentSession.name);
      process.exit(0);
    }
    
    // Create a new session
    const session = new Session({
      name: '2024-25',
      academicYear: '2024-25',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      description: 'Academic Year 2024-25',
      promotionCriteria: {
        minimumAttendance: 75,
        minimumGrade: 'D'
      },
      isCurrent: true,
      status: 'active'
    });
    
    await session.save();
    console.log('Session created successfully:', session);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating session:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});