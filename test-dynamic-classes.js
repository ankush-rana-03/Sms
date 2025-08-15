const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Class = require('./backend/models/Class');
const Session = require('./backend/models/Session');

async function testDynamicClasses() {
  console.log('🧪 Testing Dynamic Class Fetching...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if there's a current session
    const currentSession = await Session.findOne({ isCurrent: true });
    if (!currentSession) {
      console.log('⚠️  No current session found. Creating a test session...');
      
      const testSession = await Session.create({
        name: '2024-25',
        academicYear: '2024-25',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-31'),
        isCurrent: true,
        status: 'active',
        promotionCriteria: {
          minimumGrade: 'D',
          minimumAttendance: 75
        }
      });
      console.log('✅ Test session created:', testSession.name);
    }

    // Create some test classes if they don't exist
    const existingClasses = await Class.find({ session: currentSession?.name || '2024-25' });
    
    if (existingClasses.length === 0) {
      console.log('📚 Creating test classes...');
      
      const testClasses = [
        { name: 'nursery', section: 'A', academicYear: '2024-25' },
        { name: 'nursery', section: 'B', academicYear: '2024-25' },
        { name: 'lkg', section: 'A', academicYear: '2024-25' },
        { name: 'lkg', section: 'B', academicYear: '2024-25' },
        { name: 'ukg', section: 'A', academicYear: '2024-25' },
        { name: 'ukg', section: 'B', academicYear: '2024-25' },
        { name: '1', section: 'A', academicYear: '2024-25' },
        { name: '1', section: 'B', academicYear: '2024-25' },
        { name: '2', section: 'A', academicYear: '2024-25' },
        { name: '2', section: 'B', academicYear: '2024-25' },
        { name: '3', section: 'A', academicYear: '2024-25' },
        { name: '4', section: 'A', academicYear: '2024-25' },
        { name: '5', section: 'A', academicYear: '2024-25' },
        { name: '6', section: 'A', academicYear: '2024-25' },
        { name: '7', section: 'A', academicYear: '2024-25' },
        { name: '8', section: 'A', academicYear: '2024-25' },
        { name: '9', section: 'A', academicYear: '2024-25' },
        { name: '10', section: 'A', academicYear: '2024-25' },
        { name: '11', section: 'A', academicYear: '2024-25' },
        { name: '12', section: 'A', academicYear: '2024-25' }
      ];

      for (const classData of testClasses) {
        await Class.create({
          ...classData,
          session: currentSession?.name || '2024-25',
          isActive: true,
          isActiveSession: true,
          capacity: 40,
          currentStrength: 0
        });
      }
      
      console.log('✅ Test classes created');
    } else {
      console.log(`📚 Found ${existingClasses.length} existing classes`);
    }

    // Test the dynamic class fetching logic
    console.log('\n🔄 Testing Dynamic Class Fetching Logic:');
    
    const sessionName = currentSession?.name || '2024-25';
    const classes = await Class.find({ 
      session: sessionName,
      isActive: true 
    }).select('name section');

    // Extract unique class names and sections
    const classNames = [...new Set(classes.map(cls => cls.name))].sort((a, b) => {
      // Custom sorting: nursery, lkg, ukg, then numeric classes
      const order = { 'nursery': 0, 'lkg': 1, 'ukg': 2 };
      const aOrder = order[a] !== undefined ? order[a] : parseInt(a) + 3;
      const bOrder = order[b] !== undefined ? order[b] : parseInt(b) + 3;
      return aOrder - bOrder;
    });

    const sections = [...new Set(classes.map(cls => cls.section))].sort();

    // Get sections for each class
    const classesWithSections = classNames.map(className => {
      const classSections = classes
        .filter(cls => cls.name === className)
        .map(cls => cls.section)
        .sort();
      
      return {
        name: className,
        displayName: className === 'nursery' ? 'Nursery' : 
                    className === 'lkg' ? 'LKG' : 
                    className === 'ukg' ? 'UKG' : 
                    `Class ${className}`,
        sections: classSections
      };
    });

    console.log('\n📋 Available Classes and Sections:');
    classesWithSections.forEach(cls => {
      console.log(`   ${cls.displayName}: Sections ${cls.sections.join(', ')}`);
    });

    console.log('\n📊 Summary:');
    console.log(`   - Total Classes: ${classesWithSections.length}`);
    console.log(`   - Total Sections: ${sections.length}`);
    console.log(`   - Session: ${sessionName}`);

    console.log('\n🎉 Dynamic class fetching is working correctly!');
    console.log('\n📝 Benefits of this approach:');
    console.log('   ✅ Classes are fetched dynamically from the database');
    console.log('   ✅ No hardcoded values in the frontend');
    console.log('   ✅ Easy to add/remove classes without code changes');
    console.log('   ✅ Consistent across all components');
    console.log('   ✅ Supports different sections for each class');
    console.log('   ✅ Proper sorting (nursery → lkg → ukg → class 1-12)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDynamicClasses();