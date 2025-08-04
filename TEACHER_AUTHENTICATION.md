# Teacher Authentication System

## Overview

The School Management System has a secure authentication system that ensures teachers can only login with credentials created during teacher creation by administrators.

## How It Works

### 1. Teacher Creation Process

When an admin creates a teacher through the Teacher Management interface:

1. **User Account Creation**: A user account is automatically created with:
   - Email: The email provided during teacher creation
   - Password: A randomly generated secure password
   - Role: Set to "teacher"
   - Status: Active

2. **Teacher Profile Creation**: A teacher profile is linked to the user account with:
   - Personal information (name, phone, designation, etc.)
   - Professional details (subjects, qualification, experience)
   - Emergency contact information

3. **Welcome Email**: The system sends a welcome email containing:
   - Login credentials (email and temporary password)
   - Instructions for first login
   - Password reset requirement

### 2. Teacher Login Process

Teachers can login using:

1. **Email**: The email address used during teacher creation
2. **Password**: The temporary password sent via email
3. **Role**: Must select "teacher" role in the login form

### 3. Authentication Flow

```
Teacher Creation (Admin) → User Account Created → Welcome Email Sent
                                                      ↓
Teacher Login ← Email + Password + Role → Authentication Check
                                                      ↓
Dashboard Access ← Role-Based Authorization → Teacher Features
```

## Security Features

### Role-Based Access Control

- **Teachers** can access:
  - Dashboard
  - Attendance
  - Students (view only)
  - Classes
  - Teacher Attendance
  - Homework
  - Tests
  - Results
  - Profile

- **Teachers** cannot access:
  - Teacher Management (admin only)
  - WhatsApp Status (admin only)
  - Other admin-only features

### Authentication Validation

1. **Email Verification**: System checks if email exists
2. **Password Verification**: System verifies password hash
3. **Role Verification**: System ensures user role matches requested role
4. **Account Status**: System checks if account is active
5. **Login Logging**: All successful logins are logged with IP and user agent

## API Endpoints

### Teacher Creation (Admin Only)
```
POST /api/admin/teachers
Authorization: Bearer <admin-token>
```

### Teacher Login
```
POST /api/auth/login
Body: { email, password, role: "teacher" }
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer <teacher-token>
```

## Frontend Integration

### Login Form
- Role selection dropdown (Teacher/Admin/Parent)
- Email and password fields
- Form validation
- Error handling

### Route Protection
- `RoleBasedRoute` component protects routes based on user role
- Teachers are automatically redirected to appropriate dashboard
- Unauthorized access attempts are blocked

### Navigation
- Teacher-specific menu items are shown based on role
- Admin-only features are hidden from teacher interface

## Testing Teacher Login

You can test the teacher authentication system using the provided test script:

```bash
# Set admin token (get from admin login)
export ADMIN_TOKEN="your-admin-token-here"

# Run the test
node test-teacher-login.js
```

The test will:
1. Create a test teacher
2. Attempt login with teacher credentials
3. Verify role-based access
4. Test teacher-specific endpoints

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**:
   - Check if email exists in database
   - Verify password is correct
   - Ensure role is set to "teacher"

2. **"Access denied" error**:
   - Verify user role matches requested role
   - Check if account is active

3. **"Account deactivated" error**:
   - Contact administrator to reactivate account

### Password Reset

If a teacher forgets their password:
1. Admin can reset password through Teacher Management
2. New temporary password is generated
3. Teacher must change password on next login

## Security Best Practices

1. **Strong Passwords**: System generates secure random passwords
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **JWT Tokens**: Secure token-based authentication
4. **Role Validation**: Server-side role verification
5. **Login Logging**: All login attempts are logged
6. **Session Management**: Proper token expiration and refresh

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: "teacher",
  phone: String,
  address: String,
  isActive: Boolean,
  lastLogin: Date
}
```

### Teacher Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (reference to User),
  teacherId: String,
  name: String,
  email: String,
  designation: String,
  subjects: [String],
  // ... other teacher-specific fields
}
```

This ensures complete separation between authentication (User) and teacher-specific data (Teacher).