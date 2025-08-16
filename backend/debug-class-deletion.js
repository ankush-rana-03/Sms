const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugClassDeletion() {
  try {
    console.log('🔍 Debugging Class Deletion and Teacher Assignment Cleanup\n');

    // 1. First, let's see what classes exist
    console.log('1. Checking existing classes...');
    const classes = await Class.find({}).select('name section session _id');
    console.log(`Found ${classes.length} classes:`);
    classes.forEach(cls => {
      console.log(`  - ${cls.name} Section ${cls.section} (${cls.session}) - ID: ${cls._id}`);
    });

    if (classes.length === 0) {
      console.log('❌ No classes found. Please create some classes first.');
      return;
    }

    // 2. Let's check what teachers exist and their assignments
    console.log('\n2. Checking teachers and their assignments...');
    const teachers = await Teacher.find({}).populate('assignedClasses.class', 'name section');
    console.log(`Found ${teachers.length} teachers:`);
    
    teachers.forEach(teacher => {
      console.log(`\n  Teacher: ${teacher.name} (${teacher.email})`);
      if (teacher.assignedClasses && teacher.assignedClasses.length > 0) {
        console.log(`    Has ${teacher.assignedClasses.length} assignments:`);
        teacher.assignedClasses.forEach(assignment => {
          const classInfo = assignment.class ? `${assignment.class.name} Section ${assignment.class.section}` : 'Unknown Class';
          console.log(`      - ${classInfo} - Subject: ${assignment.subject} - Class ID: ${assignment.class}`);
        });
      } else {
        console.log('    No assignments');
      }
    });

    // 3. Let's test the query that should find teachers with assignments to a specific class
    if (classes.length > 0) {
      const testClassId = classes[0]._id;
      console.log(`\n3. Testing query for class ID: ${testClassId}`);
      
      const teachersWithAssignments = await Teacher.find({
        'assignedClasses.class': testClassId
      });
      
      console.log(`Query found ${teachersWithAssignments.length} teachers with assignments to this class`);
      
      if (teachersWithAssignments.length > 0) {
        console.log('Teachers found:');
        teachersWithAssignments.forEach(teacher => {
          console.log(`  - ${teacher.name}: ${teacher.assignedClasses.length} assignments`);
        });
      }
    }

    // 4. Let's also check the Teacher model structure
    console.log('\n4. Checking Teacher model structure...');
    const teacherSchema = Teacher.schema.obj;
    console.log('Teacher schema assignedClasses field:', JSON.stringify(teacherSchema.assignedClasses, null, 2));

    // 5. Let's check if there are any teachers with assignments that might not be found by the query
    console.log('\n5. Checking for potential query issues...');
    const allTeachersWithAssignments = teachers.filter(t => t.assignedClasses && t.assignedClasses.length > 0);
    
    if (allTeachersWithAssignments.length > 0) {
      console.log('Teachers with assignments found:');
      allTeachersWithAssignments.forEach(teacher => {
        console.log(`\n  ${teacher.name}:`);
        teacher.assignedClasses.forEach(assignment => {
          console.log(`    Assignment:`, {
            class: assignment.class,
            classId: assignment.class?._id,
            classIdType: typeof assignment.class?._id,
            classIdString: assignment.class?._id?.toString(),
            subject: assignment.subject,
            section: assignment.section
          });
        });
      });
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugClassDeletion();