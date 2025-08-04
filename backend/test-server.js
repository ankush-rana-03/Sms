const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Load test users
const loadUsers = () => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'test-users.json'), 'utf8');
    return JSON.parse(data).users;
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

// Save users (for future use)
const saveUsers = (users) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'test-users.json'), JSON.stringify({ users }, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password and role'
      });
    }

    // Validate role
    const validRoles = ['teacher', 'admin', 'parent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Please select teacher, admin, or parent'
      });
    }

    // Load users
    const users = loadUsers();
    
    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if role matches
    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Invalid role. This account is registered as ${user.role}`
      });
    }

    // Check password (using bcrypt compare)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      'your_jwt_secret_key_here_make_it_long_and_secure_123456789',
      { expiresIn: '30d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test users available:');
  const users = loadUsers();
  users.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
  });
  console.log('\nPassword for all users: password123');
});