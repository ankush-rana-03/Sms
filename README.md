# School Management System

A comprehensive, production-ready school management system built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring role-based authentication, camera-based attendance tracking, and advanced school management features.

## 🚀 Features

### Role-Based Access Control
- **Principal/Admin**: Full system access, user management, reports
- **Teacher**: Attendance marking, homework assignment, test creation, result compilation
- **Parent**: View student attendance, results, homework, tests
- **Student**: View personal academic information

### Advanced Features
- 📸 **Camera-based Attendance**: Teachers can mark attendance with photo capture
- 📊 **Real-time Dashboard**: Role-specific statistics and quick actions
- 📚 **Homework Management**: Assign, track, and grade homework submissions
- 🧪 **Test & Exam System**: Create, schedule, and grade tests/exams
- 📈 **Result Compilation**: Automatic grade calculation and ranking
- 👥 **Student & Teacher Management**: Complete CRUD operations
- 🏫 **Class Management**: Schedule, subjects, and student assignments
- 📧 **Email Notifications**: Automated alerts and updates
- 🔒 **Security**: JWT authentication, role-based authorization, location verification

### Performance Optimizations
- Rate limiting and request throttling
- Database indexing and query optimization
- Image compression and CDN integration
- Caching strategies
- Load balancing ready

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Cloudinary** for image storage
- **Nodemailer** for email notifications
- **Express-rate-limit** for API protection
- **Helmet** for security headers

### Frontend
- **React 18** with TypeScript
- **Material-UI** for modern UI components
- **React Router** for navigation
- **React Query** for state management
- **React Hook Form** with Yup validation
- **React Webcam** for camera integration
- **Axios** for API communication

## 📁 Project Structure

```
school-management-app/
├── backend/
│   ├── controllers/     # Business logic
│   ├── models/         # Database schemas
│   ├── routes/         # API endpoints
│   ├── middleware/     # Authentication & validation
│   ├── utils/          # Helper functions
│   └── server.js       # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   ├── services/   # API services
│   │   └── utils/      # Helper functions
│   └── public/
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/school_management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Attendance Endpoints
- `POST /api/attendance/mark` - Mark attendance with photo
- `GET /api/attendance/date/:date` - Get attendance by date
- `GET /api/attendance/student/:studentId` - Get student attendance
- `PUT /api/attendance/:id` - Update attendance
- `POST /api/attendance/bulk` - Bulk mark attendance

### Other Endpoints
- Students: `/api/students`
- Teachers: `/api/teachers`
- Classes: `/api/classes`
- Homework: `/api/homework`
- Tests: `/api/tests`
- Results: `/api/results`
- Notifications: `/api/notifications`

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Granular access control
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin request handling
- **Security Headers**: Helmet.js for additional security

## 📊 Database Schema

### Core Models
- **User**: Authentication and user management
- **Student**: Student-specific information
- **Teacher**: Teacher profiles and assignments
- **Class**: Class management and schedules
- **Attendance**: Daily attendance records
- **Homework**: Assignment tracking
- **Test**: Exam and test management
- **Result**: Academic performance tracking
- **Notification**: System notifications

## 🎯 Key Features Explained

### Camera-based Attendance
- Teachers can capture student photos during attendance
- Images are uploaded to Cloudinary for secure storage
- Location verification for school-based attendance
- Real-time attendance tracking and reporting

### Role-based Dashboard
- **Principal/Admin**: System overview, user management, reports
- **Teacher**: Class management, attendance, homework, tests
- **Parent**: Child's academic progress, attendance, homework
- **Student**: Personal academic information and progress

### Advanced School Management
- Complete student lifecycle management
- Teacher assignment and class scheduling
- Automated result calculation and ranking
- Homework submission tracking
- Test creation and grading system

## 🚀 Production Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables for production
3. Set up Cloudinary account for image storage
4. Configure email service (Gmail, SendGrid, etc.)
5. Deploy to platforms like Heroku, AWS, or DigitalOcean

### Frontend Deployment
1. Build the React application: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure environment variables for production API

### Performance Optimization
- Enable compression middleware
- Implement caching strategies
- Use CDN for static assets
- Database indexing and query optimization
- Load balancing for high traffic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Mobile app development
- Real-time notifications
- Advanced analytics and reporting
- Integration with external school systems
- AI-powered attendance recognition
- Advanced grade calculation algorithms
- Parent-teacher communication portal
- Fee management system
- Library management integration
- Transportation tracking

---

**Built with ❤️ for modern school management**