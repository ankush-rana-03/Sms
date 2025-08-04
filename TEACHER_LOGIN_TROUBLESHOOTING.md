# Teacher Login Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Invalid credentials" Error

**Symptoms:**
- Login fails with "Invalid credentials" message
- 401 status code

**Possible Causes:**
1. **Wrong email address**
2. **Wrong password**
3. **Email not found in database**
4. **Password not properly saved during teacher creation**

**Solutions:**
1. **Double-check the email** from teacher creation
2. **Copy-paste the temporary password** exactly as shown
3. **Check if teacher was actually created** in the database
4. **Verify the password was generated** during teacher creation

### Issue 2: "Access denied" Error

**Symptoms:**
- Login fails with "Access denied" message
- 403 status code

**Possible Causes:**
1. **Wrong role selected** (not "teacher")
2. **Account deactivated**
3. **Role mismatch** (user role doesn't match requested role)

**Solutions:**
1. **Select "Teacher" role** in the login form
2. **Check if account is active** in Teacher Management
3. **Verify user role** in database is "teacher"

### Issue 3: "Please provide an email, password and role" Error

**Symptoms:**
- Login fails with validation error
- 400 status code

**Possible Causes:**
1. **Missing email**
2. **Missing password**
3. **Missing role selection**

**Solutions:**
1. **Fill in all required fields**
2. **Select "Teacher" role** from dropdown
3. **Check for extra spaces** in email/password

## Step-by-Step Debugging

### Step 1: Verify Teacher Creation

1. **Go to Teacher Management**
2. **Create a new teacher** with test data
3. **Note down exactly:**
   - Email address
   - Temporary password
   - Teacher ID

### Step 2: Check Database

1. **Verify teacher exists** in Teacher Management list
2. **Check if user account was created** (should show in teacher details)
3. **Verify role is "teacher"**

### Step 3: Test Login

1. **Go to Login page**
2. **Select "Teacher" role**
3. **Enter exact email and password**
4. **Check browser console** for any errors
5. **Check network tab** for API response

### Step 4: Use Debug Scripts

Run the provided debug scripts:

```bash
# Simple test with your credentials
node simple-teacher-login-test.js

# Comprehensive debug
node debug-teacher-login.js
```

## Common Mistakes

### 1. Role Selection
- **Wrong:** Selecting "Admin" instead of "Teacher"
- **Correct:** Select "Teacher" role

### 2. Password Copying
- **Wrong:** Manually typing the password
- **Correct:** Copy-paste the exact password

### 3. Email Format
- **Wrong:** Adding extra spaces or characters
- **Correct:** Use exact email as shown

### 4. Case Sensitivity
- **Wrong:** Changing case of email or password
- **Correct:** Use exact case as provided

## Testing Checklist

- [ ] Backend server is running
- [ ] Database is connected
- [ ] Teacher was created successfully
- [ ] Email is correct
- [ ] Password is copied exactly
- [ ] Role is set to "Teacher"
- [ ] No extra spaces in fields
- [ ] Browser console shows no errors
- [ ] Network requests are successful

## API Testing

### Test Login Endpoint Directly

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-teacher-email@school.com",
    "password": "your-temp-password",
    "role": "teacher"
  }'
```

### Expected Response

```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "Teacher Name",
    "email": "teacher@school.com",
    "role": "teacher",
    "isActive": true
  }
}
```

## Environment Variables

Make sure these are set correctly:

```bash
# Backend
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=30d
MONGODB_URI=your-mongodb-connection-string

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
```

## Database Checks

### Check User Collection

```javascript
// In MongoDB shell or Compass
db.users.findOne({ email: "teacher@school.com" })
```

### Check Teacher Collection

```javascript
// In MongoDB shell or Compass
db.teachers.findOne({ email: "teacher@school.com" })
```

## Still Having Issues?

If you're still experiencing problems:

1. **Check server logs** for any errors
2. **Verify database connection**
3. **Test with a fresh teacher creation**
4. **Use the debug scripts** to isolate the issue
5. **Check if email service is working** (for password delivery)

## Quick Fixes

### Reset Teacher Password

1. **Go to Teacher Management**
2. **Find the teacher**
3. **Click "Reset Password"**
4. **Enter a new password**
5. **Try logging in with new password**

### Recreate Teacher

1. **Delete the problematic teacher**
2. **Create a new teacher** with same details
3. **Use new credentials** to login

### Check Network Issues

1. **Verify API endpoint** is accessible
2. **Check CORS settings**
3. **Ensure frontend can reach backend**