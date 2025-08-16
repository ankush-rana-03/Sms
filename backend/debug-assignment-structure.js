const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugAssignmentStructure() {
  try {
    console.log('🔍 Debugging Teacher Assignment Structure...\n');
    
    // Get all teachers
    const teachers = await Teacher.find({});
    console.log(`Found ${teachers.length} teachers\n`);
    
    // Examine each teacher's assignments
    for (const teacher of teachers) {
      if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
        console.log(`📋 Teacher: ${teacher.name} (${teacher.email})`);
        console.log(`   Total assignments: ${teacher.assignedClasses.length}\n`);
        
        teacher.assignedClasses.forEach((assignment, index) => {
          console.log(`   Assignment ${index + 1}:`);
          console.log(`     _id: ${assignment._id}`);
          console.log(`     class: ${assignment.class} (type: ${typeof assignment.class})`);
          console.log(`     grade: ${assignment.grade}`);
          console.log(`     section: ${assignment.section}`);
          console.log(`     subject: ${assignment.subject}`);
          console.log(`     time: ${assignment.time}`);
          console.log(`     day: ${assignment.day}`);
          console.log('');
        });
      }
    }
    
    // Get all classes
    const classes = await Class.find({});
    console.log(`\n🏫 Found ${classes.length} classes:\n`);
    
    classes.forEach(cls => {
      console.log(`   Class: ${cls.name} - Section ${cls.section} (ID: ${cls._id})`);
    });
    
    // Test the query that should find assignments
    if (classes.length > 0) {
      const testClassId = classes[0]._id;
      console.log(`\n🧪 Testing assignment query for class: ${testClassId}`);
      
      const teachersWithAssignments = await Teacher.find({
        'assignedClasses.class': testClassId
      });
      
      console.log(`Query result: Found ${teachersWithAssignments.length} teachers with assignments to this class`);
      
      if (teachersWithAssignments.length > 0) {
        teachersWithAssignments.forEach(teacher => {
          console.log(`   - ${teacher.name}: ${teacher.assignedClasses.length} assignments`);
        });
      }
    }
    
    // Check if there are any assignments with class field
    const teachersWithClassField = await Teacher.find({
      'assignedClasses.class': { $exists: true, $ne: null }
    });
    
    console.log(`\n🔍 Teachers with assignments containing 'class' field: ${teachersWithClassField.length}`);
    
    if (teachersWithClassField.length > 0) {
      teachersWithClassField.forEach(teacher => {
        console.log(`   - ${teacher.name}: ${teacher.assignedClasses.length} assignments`);
        teacher.assignedClasses.forEach(assignment => {
          if (assignment.class) {
            console.log(`     * Has class field: ${assignment.class} (${typeof assignment.class})`);
          }
        });
      });
    }
    
    // Check if there are any assignments with grade/section/subject but no class
    const teachersWithGradeSection = await Teacher.find({
      'assignedClasses.grade': { $exists: true, $ne: null }
    });
    
    console.log(`\n🔍 Teachers with assignments containing 'grade' field: ${teachersWithGradeSection.length}`);
    
    if (teachersWithGradeSection.length > 0) {
      teachersWithGradeSection.forEach(teacher => {
        console.log(`   - ${teacher.name}: ${teacher.assignedClasses.length} assignments`);
        teacher.assignedClasses.forEach(assignment => {
          if (assignment.grade) {
            console.log(`     * Has grade field: ${assignment.grade} - Section ${assignment.section} - Subject ${assignment.subject}`);
          }
        });
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAssignmentStructure();