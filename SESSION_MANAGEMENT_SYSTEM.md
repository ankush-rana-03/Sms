# Session Management System

## Overview

The Session Management System is a comprehensive solution for managing academic sessions, student progression, and data archiving in the School Management System. It provides automated promotion logic, session-based data organization, and seamless transitions between academic years.

## 🚀 Features

### Core Functionality
- **Session Creation & Management**: Create and manage academic sessions with custom criteria
- **Student Progression Logic**: Automated pass/fail determination based on attendance and grades
- **Data Archiving**: Secure archiving of completed sessions with full data preservation
- **Fresh Start Preparation**: Automated preparation for new academic sessions
- **Session-based Filtering**: All data (students, classes, results) filtered by active session

### Advanced Features
- **Promotion Criteria Configuration**: Customizable minimum attendance and grade requirements
- **Real-time Statistics**: Live session statistics and promotion breakdowns
- **Role-based Access Control**: Admin and Principal-only access to session management
- **Audit Trail**: Complete tracking of all session operations and changes

## 📋 System Architecture

### Database Models

#### Session Model
```javascript
{
  name: String,                    // Session name (e.g., "2024-25 Session")
  academicYear: String,           // Academic year (e.g., "2024-2025")
  startDate: Date,                // Session start date
  endDate: Date,                  // Session end date
  status: String,                 // 'active', 'completed', 'archived'
  isCurrent: Boolean,             // Only one session can be current
  description: String,            // Session description
  promotionCriteria: {
    minimumAttendance: Number,    // Minimum attendance percentage
    minimumGrade: String,         // Minimum passing grade
    requireAllSubjects: Boolean   // Require passing all subjects
  },
  archivedData: {
    students: Array,              // Archived student data
    classes: Array                // Archived class data
  }
}
```

#### Updated Student Model
```javascript
{
  // ... existing fields ...
  currentSession: String,         // Current session name
  promotionStatus: String,        // 'pending', 'promoted', 'retained', 'graduated'
  promotionDate: Date,            // Date of promotion decision
  promotionNotes: String,         // Notes about promotion decision
  previousGrade: String,          // Previous grade (for fresh start)
  previousSection: String         // Previous section (for fresh start)
}
```

#### Updated Class Model
```javascript
{
  // ... existing fields ...
  session: String,                // Session name
  isActiveSession: Boolean,       // Whether class is active in current session
  sessionStartDate: Date,         // Session start date
  sessionEndDate: Date            // Session end date
}
```

## 🔌 API Endpoints

### Session Management

#### GET /api/sessions
Get all sessions
```javascript
Response: Array of session objects
```

#### GET /api/sessions/current
Get current active session
```javascript
Response: Current session object or null
```

#### POST /api/sessions
Create new session
```javascript
Body: {
  name: String,
  academicYear: String,
  startDate: Date,
  endDate: Date,
  description: String,
  promotionCriteria: {
    minimumAttendance: Number,
    minimumGrade: String,
    requireAllSubjects: Boolean
  }
}
```

#### PUT /api/sessions/:id
Update session
```javascript
Body: Session fields to update
```

#### PATCH /api/sessions/:id/set-current
Set session as current
```javascript
Response: Updated session object
```

#### POST /api/sessions/:id/process-promotions
Process student promotions for session
```javascript
Response: {
  message: String,
  session: String,
  totalStudents: Number,
  results: Array of promotion results
}
```

#### POST /api/sessions/:id/archive
Archive session data
```javascript
Response: {
  message: String,
  archivedStudents: Number,
  archivedClasses: Number
}
```

#### POST /api/sessions/:id/fresh-start
Prepare fresh start for new session
```javascript
Response: {
  message: String,
  promotedStudents: Number,
  session: String
}
```

#### GET /api/sessions/:id/statistics
Get session statistics
```javascript
Response: {
  totalStudents: Number,
  totalClasses: Number,
  totalResults: Number,
  promotionBreakdown: {
    promoted: Number,
    retained: Number,
    graduated: Number,
    pending: Number
  },
  averageAttendance: Number
}
```

#### DELETE /api/sessions/:id
Delete archived session (admin only)
```javascript
Response: Success message
```

### Updated Endpoints

#### GET /api/classes
Now supports session filtering:
```javascript
Query: ?session=sessionName
```

#### GET /api/students
Now supports session filtering:
```javascript
Query: ?session=sessionName
```

## 🎯 Promotion Logic

### Criteria Evaluation
1. **Attendance Check**: Student must meet minimum attendance percentage
2. **Grade Check**: Student must meet minimum grade requirements in all subjects
3. **Subject Requirements**: Option to require passing all subjects or allow some failures

### Promotion Statuses
- **pending**: Initial state, no decision made
- **promoted**: Student meets all criteria
- **retained**: Student does not meet criteria
- **graduated**: Student completed final grade (custom logic)

### Example Promotion Flow
```javascript
// Student with 80% attendance and grades: A, B, C, D
// Minimum criteria: 75% attendance, minimum grade D
// Result: PROMOTED ✅

// Student with 70% attendance and grades: A, B, C, D
// Minimum criteria: 75% attendance, minimum grade D
// Result: RETAINED ❌ (attendance below minimum)
```

## 🔄 Session Lifecycle

### 1. Session Creation
```javascript
// Create new session
POST /api/sessions
{
  "name": "2024-25 Session",
  "academicYear": "2024-2025",
  "startDate": "2024-06-01",
  "endDate": "2025-05-31",
  "promotionCriteria": {
    "minimumAttendance": 75,
    "minimumGrade": "D",
    "requireAllSubjects": true
  }
}
```

### 2. Active Session
- Students and classes are created with current session
- All data is automatically filtered by session
- Real-time statistics available

### 3. Promotion Processing
```javascript
// Process promotions at end of session
POST /api/sessions/:id/process-promotions
```

### 4. Archiving
```javascript
// Archive completed session
POST /api/sessions/:id/archive
```

### 5. Fresh Start
```javascript
// Prepare for new session
POST /api/sessions/:id/fresh-start
```

## 🎨 Frontend Components

### Sessions Page
- **Session Grid**: Visual cards showing all sessions with status
- **Current Session Banner**: Highlights active session
- **Action Buttons**: Process promotions, archive, fresh start
- **Statistics Display**: Real-time session statistics
- **Promotion Results Table**: Detailed promotion outcomes

### Key Features
- **Role-based UI**: Different actions available based on user role
- **Confirmation Dialogs**: Safe operations with confirmation
- **Real-time Updates**: Automatic refresh after operations
- **Responsive Design**: Works on all device sizes

## 🔧 Configuration

### Environment Variables
```bash
# No additional environment variables required
# Uses existing JWT_SECRET and MONGODB_URI
```

### Database Indexes
```javascript
// Session model
{ name: 1 } // Unique session names

// Class model
{ name: 1, section: 1, academicYear: 1, session: 1 } // Unique class per session

// Student model
// No additional indexes (uses existing)

// Attendance model
{ studentId: 1, date: 1, session: 1 } // Unique attendance per student per day per session

// Result model
{ studentId: 1, session: 1, academicYear: 1, term: 1 } // Unique result per student per session per term
```

## 🧪 Testing

### Test Script
Run the comprehensive test suite:
```bash
node test-session-management.js
```

### Test Coverage
- ✅ Session creation and management
- ✅ Student and class creation with session
- ✅ Promotion processing
- ✅ Data archiving
- ✅ Fresh start preparation
- ✅ Statistics generation
- ✅ Role-based access control

## 🚀 Deployment

### Backend
1. Ensure MongoDB is running
2. Start the server: `npm start`
3. Verify session routes are accessible

### Frontend
1. Build the application: `npm run build`
2. Deploy to your hosting platform
3. Verify Sessions page is accessible to admin/principal users

## 🔒 Security

### Access Control
- **Session Management**: Admin and Principal only
- **Promotion Processing**: Admin and Principal only
- **Archiving**: Admin and Principal only
- **Fresh Start**: Admin and Principal only
- **Session Deletion**: Admin only

### Data Protection
- All session operations are logged
- Archived data is preserved and cannot be modified
- Session deletion only available for archived sessions
- Automatic session validation prevents data corruption

## 📊 Monitoring

### Key Metrics
- Session creation rate
- Promotion success rate
- Archive completion rate
- Fresh start preparation time
- Error rates for session operations

### Logging
All session operations are logged with:
- User ID and role
- Operation type and timestamp
- Affected session and data counts
- Success/failure status

## 🔮 Future Enhancements

### Planned Features
- **Bulk Operations**: Process multiple sessions simultaneously
- **Advanced Analytics**: Detailed session performance metrics
- **Automated Scheduling**: Automatic session transitions
- **Data Export**: Export session data to external systems
- **Audit Reports**: Comprehensive audit trail reports

### Integration Points
- **Notification System**: Automatic notifications for session events
- **Reporting System**: Session-based report generation
- **Dashboard Integration**: Session metrics in main dashboard
- **Mobile App**: Session management on mobile devices

## 🆘 Troubleshooting

### Common Issues

#### Session Creation Fails
- Check if session name already exists
- Verify all required fields are provided
- Ensure user has admin/principal role

#### Promotion Processing Errors
- Verify students have attendance records
- Check if results exist for the session
- Ensure session is active

#### Archive Operation Fails
- Verify session has data to archive
- Check database connection
- Ensure sufficient storage space

#### Fresh Start Issues
- Verify session has promoted students
- Check if new session exists
- Ensure proper grade increment logic

### Debug Commands
```bash
# Check current session
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/sessions/current

# Get session statistics
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/sessions/SESSION_ID/statistics

# List all sessions
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/sessions
```

## 📞 Support

For issues or questions about the Session Management System:
1. Check the troubleshooting section
2. Review the test script for examples
3. Verify database connectivity
4. Check user permissions and roles

---

**Session Management System** - Complete academic session lifecycle management with automated promotion logic and data archiving.