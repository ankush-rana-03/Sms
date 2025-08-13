# Teacher Assignment System

A comprehensive and professional system for managing teacher-class-subject assignments with advanced conflict detection and scheduling capabilities.

## 🚀 Features

### Core Functionality
- **Teacher Assignment Management**: Assign teachers to classes, subjects, days, and time slots
- **Advanced Conflict Detection**: Prevents double-booking of teachers and classes
- **Flexible Scheduling**: Support for multiple academic years and semesters
- **Professional Validation**: Comprehensive input validation and error handling

### Advanced Features
- **Time Conflict Prevention**: Automatic detection of overlapping schedules
- **Weekly Schedule Views**: Teacher and class-specific weekly schedules
- **Bulk Operations**: Create multiple assignments at once
- **Search & Filtering**: Advanced search with multiple filter options
- **Pagination**: Efficient handling of large datasets

### Data Integrity
- **Unique Constraints**: Prevents duplicate assignments
- **Referential Integrity**: Ensures valid teacher and class references
- **Audit Trail**: Tracks creation and modification history

## 🏗️ Architecture

### Models
- **TeacherAssignment**: Core model with comprehensive validation
- **Teacher**: Teacher information and credentials
- **Class**: Class details and structure
- **User**: System user management

### Controllers
- **teacherAssignment.js**: Full CRUD operations with conflict detection
- **teacherManagement.js**: Teacher management operations

### Routes
- **teacherAssignments.js**: RESTful API endpoints with Swagger documentation

## 📋 API Endpoints

### Assignment Management
```
POST   /api/assignments              - Create new assignment
GET    /api/assignments              - Get all assignments (with filtering)
GET    /api/assignments/:id          - Get assignment by ID
PUT    /api/assignments/:id          - Update assignment
DELETE /api/assignments/:id          - Delete assignment
```

### Teacher-Specific Operations
```
GET    /api/assignments/teacher/:teacherId           - Get teacher assignments
GET    /api/assignments/teacher/:teacherId/schedule  - Get teacher weekly schedule
```

### Class-Specific Operations
```
GET    /api/assignments/class/:classId           - Get class assignments
GET    /api/assignments/class/:classId/schedule  - Get class weekly schedule
```

### Utility Operations
```
POST   /api/assignments/check-conflicts  - Check for time conflicts
POST   /api/assignments/bulk             - Bulk create assignments
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Express.js framework

### Backend Setup
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set environment variables:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

3. Start the server:
   ```bash
   npm start
   ```

### Database Setup
The system automatically creates necessary indexes and collections. Ensure MongoDB is running and accessible.

## 📊 Data Model

### TeacherAssignment Schema
```javascript
{
  teacher: ObjectId,        // Reference to Teacher
  class: ObjectId,          // Reference to Class
  subject: String,          // Subject name
  day: String,              // Day of week (Monday-Sunday)
  startTime: String,        // Start time (HH:MM format)
  endTime: String,          // End time (HH:MM format)
  academicYear: String,     // Academic year (e.g., "2024-2025")
  semester: String,         // Semester (First-Eighth)
  isActive: Boolean,        // Assignment status
  notes: String,            // Additional notes
  createdBy: ObjectId,      // User who created
  updatedBy: ObjectId,      // User who last updated
  timestamps: true          // Created/updated timestamps
}
```

### Validation Rules
- **Time Format**: HH:MM (24-hour format)
- **Days**: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- **Semesters**: First, Second, Third, Fourth, Fifth, Sixth, Seventh, Eighth
- **Time Logic**: Start time must be before end time
- **Conflict Prevention**: No overlapping schedules for same teacher/class on same day

## 🧪 Testing

### Comprehensive Test Suite
Run the complete test suite:
```bash
node test-teacher-assignment-system.js
```

### Test Coverage
- ✅ Assignment creation and validation
- ✅ Time conflict detection
- ✅ CRUD operations
- ✅ Filtering and search
- ✅ Pagination
- ✅ Bulk operations
- ✅ Weekly schedules
- ✅ Error handling

### Test Scenarios
1. **Valid Assignment Creation**: Normal assignment creation
2. **Time Conflict Detection**: Prevents overlapping schedules
3. **Validation Testing**: Input validation and error handling
4. **Update Operations**: Assignment modification with conflict checking
5. **Bulk Operations**: Multiple assignment creation
6. **Schedule Views**: Weekly schedule generation
7. **Filtering**: Advanced search and filter capabilities

## 🔒 Security Features

### Authentication
- JWT-based authentication required for all endpoints
- User role-based access control
- Secure token validation

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection through proper escaping

### Rate Limiting
- API rate limiting to prevent abuse
- Configurable request limits

## 📈 Performance Features

### Database Optimization
- Compound indexes for efficient queries
- Optimized aggregation pipelines
- Connection pooling

### Caching Strategy
- Response compression
- Efficient data pagination
- Optimized database queries

## 🚨 Error Handling

### Comprehensive Error Messages
- **400 Bad Request**: Validation errors, missing fields
- **404 Not Found**: Assignment, teacher, or class not found
- **409 Conflict**: Time conflicts, duplicate assignments
- **500 Internal Server Error**: Server-side errors

### Error Response Format
```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "Detailed error information",
  "conflicts": [] // For time conflict errors
}
```

## 🔄 Conflict Detection Logic

### Teacher Conflicts
- Prevents same teacher from having overlapping schedules
- Checks all assignments for the same teacher on the same day
- Considers academic year and semester

### Class Conflicts
- Prevents same class from having overlapping schedules
- Ensures no double-booking of classroom time
- Maintains class schedule integrity

### Time Overlap Detection
```javascript
// Overlap scenarios detected:
// 1. New assignment starts during existing assignment
// 2. New assignment ends during existing assignment
// 3. New assignment completely contains existing assignment
// 4. New assignment is completely contained by existing assignment
```

## 📱 Frontend Integration

### API Integration
- RESTful API endpoints
- JSON response format
- Comprehensive error handling
- Real-time conflict checking

### UI Components
- Assignment creation form
- Schedule viewer
- Conflict resolution interface
- Bulk assignment manager

## 🚀 Usage Examples

### Create Assignment
```javascript
const assignment = {
  teacherId: "teacher_id_here",
  classId: "class_id_here",
  subject: "Mathematics",
  day: "Monday",
  startTime: "09:00",
  endTime: "10:00",
  semester: "First",
  notes: "Advanced Mathematics class"
};

const response = await fetch('/api/assignments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(assignment)
});
```

### Check for Conflicts
```javascript
const conflictCheck = {
  teacherId: "teacher_id_here",
  day: "Monday",
  startTime: "09:30",
  endTime: "10:30",
  semester: "First"
};

const response = await fetch('/api/assignments/check-conflicts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(conflictCheck)
});
```

### Get Weekly Schedule
```javascript
const response = await fetch('/api/assignments/teacher/teacher_id_here/schedule', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const schedule = await response.json();
// Returns organized weekly schedule by day
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/school_management

# Server
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Configuration
```javascript
// MongoDB connection options
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 30000
}
```

## 📚 API Documentation

### Swagger Integration
- Complete API documentation
- Interactive API testing
- Request/response examples
- Schema definitions

### Documentation Access
- Available at `/api-docs` when Swagger is configured
- Comprehensive endpoint descriptions
- Request/response schemas
- Authentication requirements

## 🚨 Troubleshooting

### Common Issues
1. **Time Conflict Errors**: Check existing assignments for overlapping times
2. **Validation Errors**: Ensure all required fields are provided
3. **Authentication Errors**: Verify JWT token is valid and not expired
4. **Database Connection**: Check MongoDB connection string and network access

### Debug Mode
Enable debug logging:
```bash
DEBUG=teacher-assignment:* npm start
```

### Log Files
- Application logs in console
- Error logs with stack traces
- Request/response logging

## 🔄 Migration from Old System

### Data Migration
1. Export existing assignment data
2. Transform data to new schema format
3. Import using bulk creation endpoint
4. Verify data integrity

### Schema Changes
- New `TeacherAssignment` model replaces old assignment fields
- Enhanced validation and conflict detection
- Improved data structure and relationships

## 📈 Future Enhancements

### Planned Features
- **Recurring Assignments**: Support for repeating schedules
- **Room Management**: Classroom assignment and conflict detection
- **Calendar Integration**: Export to external calendar systems
- **Notification System**: Automated conflict alerts
- **Reporting**: Advanced analytics and reporting tools

### Performance Improvements
- **Redis Caching**: Implement Redis for frequently accessed data
- **Database Sharding**: Support for large-scale deployments
- **API Versioning**: Backward compatibility support

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

### Code Standards
- ESLint configuration
- Prettier formatting
- Comprehensive testing
- Documentation updates

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- API documentation available at `/api-docs`
- Code comments and inline documentation
- Comprehensive README files

### Issues
- GitHub Issues for bug reports
- Feature request tracking
- Community support channels

---

**Note**: This system replaces the previous teacher assignment functionality with a more robust, scalable, and professional solution. All existing functionality has been enhanced with better validation, conflict detection, and user experience.