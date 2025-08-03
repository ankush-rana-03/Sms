# Teacher Management System

## Overview

The Teacher Management System provides comprehensive functionality for administrators to manage teachers in the school management application. This system includes full CRUD operations, password management, login monitoring, and online status tracking.

## Features

### 1. Teacher CRUD Operations
- **Create Teachers**: Add new teachers with complete profile information
- **Read Teachers**: View all teachers with pagination and filtering
- **Update Teachers**: Modify teacher information and assignments
- **Delete Teachers**: Deactivate teachers (soft delete)

### 2. Teacher Profile Management
- **Basic Information**: Name, email, phone, designation
- **Designation Types**: TGT, PGT, JBT, NTT
- **Qualifications**: Degree, institution, year of completion
- **Experience**: Years of experience, previous schools
- **Specializations**: Areas of expertise
- **Salary Information**: Compensation details
- **Emergency Contact**: Contact information for emergencies

### 3. Password Management
- **Secure Password Generation**: Automatic generation of secure passwords
- **Password Reset**: Admin can reset teacher passwords
- **Force Password Change**: Require teachers to change password on next login
- **Temporary Password Display**: Show generated passwords to admin

### 4. Class Assignment
- **Assign Classes**: Assign specific classes to teachers
- **Subject Assignment**: Assign subjects to teachers for specific classes
- **Multiple Assignments**: Teachers can be assigned to multiple classes
- **Validation**: Ensure classes exist before assignment

### 5. Login Monitoring
- **Login Logs**: Track all teacher login activities
- **Session Duration**: Monitor how long teachers are logged in
- **IP Address Tracking**: Record IP addresses for security
- **User Agent Logging**: Track browser/device information
- **Login Statistics**: View login patterns and statistics

### 6. Online Status Tracking
- **Real-time Status**: Track if teachers are currently online
- **Last Seen**: Record when teachers were last active
- **Activity Monitoring**: Track last activity timestamps
- **Online Teachers List**: View all currently online teachers

### 7. Statistics and Analytics
- **Teacher Counts**: Total, active, and online teacher counts
- **Designation Statistics**: Breakdown by teacher designation
- **Recent Logins**: Latest teacher login activities
- **Session Analytics**: Average session durations and patterns

## Database Schema

### Teacher Model
```javascript
{
  user: ObjectId,                    // Reference to User model
  teacherId: String,                 // Auto-generated unique ID
  name: String,                      // Teacher's full name
  email: String,                     // Email address
  phone: String,                     // Phone number
  designation: String,               // TGT, PGT, JBT, NTT
  subjects: [String],                // Array of subjects taught
  assignedClasses: [{                // Classes assigned to teacher
    class: ObjectId,                 // Reference to Class model
    section: String,
    subject: String,
    grade: String
  }],
  qualification: {                   // Educational qualifications
    degree: String,
    institution: String,
    yearOfCompletion: Number
  },
  experience: {                      // Work experience
    years: Number,
    previousSchools: [String]
  },
  specialization: [String],          // Areas of specialization
  joiningDate: Date,                 // Date of joining
  salary: Number,                    // Salary amount
  isActive: Boolean,                 // Active status
  onlineStatus: {                    // Online status tracking
    isOnline: Boolean,
    lastSeen: Date,
    lastActivity: Date
  },
  passwordResetRequired: Boolean,    // Force password change flag
  lastPasswordChange: Date           // Last password change date
}
```

### LoginLog Model
```javascript
{
  user: ObjectId,                    // Reference to User model
  teacher: ObjectId,                 // Reference to Teacher model
  loginTime: Date,                   // Login timestamp
  logoutTime: Date,                  // Logout timestamp (null if active)
  ipAddress: String,                 // IP address
  userAgent: String,                 // Browser/device info
  status: String,                    // 'success' or 'failed'
  sessionDuration: Number,           // Session duration in minutes
  isActive: Boolean                  // Active status
}
```

## API Endpoints

### Teacher Management (Admin Only)
- `GET /api/admin/teachers` - Get all teachers with pagination and filters
- `POST /api/admin/teachers` - Create new teacher
- `PUT /api/admin/teachers/:teacherId` - Update teacher
- `DELETE /api/admin/teachers/:teacherId` - Deactivate teacher

### Password Management
- `POST /api/admin/teachers/:teacherId/reset-password` - Reset teacher password

### Login Monitoring
- `GET /api/admin/teachers/:teacherId/login-logs` - Get teacher login logs
- `GET /api/admin/teachers/:teacherId/status` - Get teacher online status
- `PUT /api/admin/teachers/:teacherId/status` - Update teacher status

### Class Assignment
- `POST /api/admin/teachers/:teacherId/assign-classes` - Assign classes to teacher

### Statistics
- `GET /api/admin/teachers/online/teachers` - Get online teachers
- `GET /api/admin/teachers/statistics/overview` - Get teacher statistics

## Frontend Components

### TeacherManagement.tsx
Main component for teacher management with:
- Statistics dashboard
- Teacher list with filtering and pagination
- Create/Edit teacher dialogs
- Login logs viewer
- Password reset functionality
- Class assignment interface

### Features
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live status updates and notifications
- **Advanced Filtering**: Search by name, email, designation, status
- **Pagination**: Handle large numbers of teachers efficiently
- **Form Validation**: Comprehensive input validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during operations

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin only)
- Protected API endpoints
- Session management

### Password Security
- Secure password generation (12 characters with mixed case, numbers, symbols)
- Password hashing with bcrypt
- Force password change on first login
- Password reset functionality

### Monitoring & Logging
- Comprehensive login/logout logging
- IP address tracking
- User agent logging
- Session duration monitoring
- Failed login attempt tracking

## Setup Instructions

### Backend Setup
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up environment variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   ```

3. Run the cleanup script to remove dummy data:
   ```bash
   node scripts/cleanupTeachers.js
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Install additional dependencies for date pickers:
   ```bash
   npm install @mui/x-date-pickers date-fns
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage Guide

### Creating a New Teacher
1. Navigate to Teacher Management
2. Click "Add Teacher" button
3. Fill in required information:
   - Name, email, phone, designation
   - Subjects (comma-separated)
   - Qualifications and experience
   - Salary information
4. Click "Create"
5. Note the generated temporary password
6. Provide the password to the teacher

### Managing Existing Teachers
1. View teacher list with filtering options
2. Use action buttons for each teacher:
   - **View/Edit**: Modify teacher information
   - **Login Logs**: View login history
   - **Reset Password**: Generate new password
   - **Assign Classes**: Manage class assignments
   - **Deactivate**: Remove teacher access

### Monitoring Teacher Activity
1. View statistics dashboard for overview
2. Check online status indicators
3. Review login logs for specific teachers
4. Monitor session durations and patterns

## Best Practices

### Data Management
- Regularly review and clean up inactive teachers
- Monitor login patterns for security
- Keep teacher information up to date
- Use appropriate designations for teachers

### Security
- Regularly rotate passwords
- Monitor for suspicious login activity
- Keep teacher access permissions current
- Review login logs periodically

### Performance
- Use pagination for large teacher lists
- Implement proper indexing on database
- Cache frequently accessed data
- Optimize database queries

## Troubleshooting

### Common Issues
1. **Teacher not appearing in list**: Check if teacher is active
2. **Login issues**: Verify password reset and force change settings
3. **Class assignment errors**: Ensure classes exist in database
4. **Permission errors**: Verify admin role and JWT token

### Debug Steps
1. Check server logs for errors
2. Verify database connections
3. Test API endpoints directly
4. Check frontend console for errors
5. Validate JWT token expiration

## Future Enhancements

### Planned Features
- **Bulk Operations**: Import/export teacher data
- **Advanced Analytics**: Detailed usage reports
- **Notification System**: Alerts for unusual activity
- **Mobile App**: Native mobile application
- **Integration**: Connect with other school systems

### Performance Improvements
- **Caching**: Redis-based caching
- **Search**: Elasticsearch integration
- **Real-time Updates**: WebSocket implementation
- **File Upload**: Profile picture management

## Support

For technical support or questions about the Teacher Management System, please refer to the main project documentation or contact the development team.