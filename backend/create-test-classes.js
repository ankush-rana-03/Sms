const mongoose = require('mongoose');
require('dotenv').config();
const Class = require('./models/Class');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

const testClasses = [
  { name: 'Class 1', section: 'A', academicYear: '2024-2025', roomNumber: '101', capacity: 40 },
  { name: 'Class 2', section: 'A', academicYear: '2024-2025', roomNumber: '102', capacity: 40 },
  { name: 'Class 3', section: 'B', academicYear: '2024-2025', roomNumber: '103', capacity: 40 },
  { name: 'Class 4', section: 'A', academicYear: '2024-2025', roomNumber: '104', capacity: 40 },
  { name: 'Class 5', section: 'B', academicYear: '2024-2025', roomNumber: '105', capacity: 40 }
];

async function createClasses() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const cls of testClasses) {
    const exists = await Class.findOne({ name: cls.name, section: cls.section, academicYear: cls.academicYear });
    if (!exists) {
      await Class.create(cls);
      console.log('Created:', cls.name, cls.section);
    } else {
      console.log('Already exists:', cls.name, cls.section);
    }
  }

  await mongoose.disconnect();
  console.log('Done!');
}

createClasses().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});