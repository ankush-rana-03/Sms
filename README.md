# School Management System

A comprehensive school management system with role-based authentication, manual attendance tracking, and advanced school management features.

## Features

### User Roles
- **Admin**: Full system access, user management, attendance management
- **Principal**: School-wide management, attendance oversight
- **Teacher**: Attendance marking, homework assignment, test creation, result compilation
- **Parent**: View student attendance, results, homework, tests

### Core Features
- 🔐 **Role-based Authentication**: Secure login with JWT tokens
- 📊 **Manual Attendance System**: Teachers can mark attendance with buttons (Present, Absent, Late)
- 📚 **Class Management**: Create and manage classes with students
- 📝 **Homework Management**: Assign and track homework
- 📋 **Test Management**: Create and manage tests
- 📈 **Results Management**: Compile and view student results
- 🔔 **Notifications**: Real-time notifications for important events

### Manual Attendance System
- Teachers can mark attendance using simple buttons (Present, Absent, Late)
- Date restrictions: Teachers can only mark/edit today's attendance
- Historical view: Teachers can view but not edit previous days
- Admin access: Admins can edit any past attendance records
- Future restrictions: No one can mark attendance for future dates
- Bulk operations: Mark attendance for entire class at once

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/:id/attendance` - Get student attendance

### Attendance Endpoints
- `POST /api/attendance/mark` - Mark attendance manually
- `GET /api/attendance/date/:date` - Get attendance by date
- `GET /api/attendance/student/:studentId` - Get student attendance
- `PUT /api/attendance/:id` - Update attendance
- `POST /api/attendance/bulk` - Bulk mark attendance
- `GET /api/attendance/today/:classId` - Get today's attendance for class

### Homework
- `GET /api/homework` - Get all homework
- `POST /api/homework` - Create homework
- `PUT /api/homework/:id` - Update homework
- `DELETE /api/homework/:id` - Delete homework

### Tests
- `GET /api/tests` - Get all tests
- `POST /api/tests` - Create test
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test

### Results
- `GET /api/results` - Get all results
- `POST /api/results` - Create result
- `PUT /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification

## Database Schema

### User Model
- **User**: Authentication and role management
- **Class**: Class information and management
- **Student**: Student profiles and information
- **Attendance**: Daily attendance records
- **Homework**: Homework assignments
- **Test**: Test information
- **Result**: Student results
- **Notification**: System notifications

### Manual Attendance System
- Teachers can mark attendance with simple buttons
- Date-based restrictions prevent unauthorized access
- Admin override capabilities for historical data
- Real-time attendance tracking and reporting

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure your environment variables
npm start
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

## Usage

### Manual Attendance Marking
1. **Teacher Login**: Teachers log in to the system
2. **Select Class**: Choose the class to mark attendance for
3. **Mark Attendance**: Use buttons to mark students as Present, Absent, or Late
4. **Edit Attendance**: Teachers can edit today's attendance only
5. **View History**: View but not edit previous days' attendance

### Admin Functions
- **Full Access**: Admins can edit any attendance record
- **Historical Data**: Access and modify past attendance records
- **User Management**: Manage all users and their permissions
- **System Oversight**: Monitor and manage the entire system

### Date Restrictions
- **Today Only**: Teachers can only mark/edit today's attendance
- **Past View**: Teachers can view but not edit previous days
- **Future Blocked**: No one can mark attendance for future dates
- **Admin Override**: Admins can edit any past attendance

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Note**: This system uses manual attendance marking without face recognition for improved reliability and ease of use.