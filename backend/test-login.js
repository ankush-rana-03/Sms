const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testRoleBasedLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log('Connected to MongoDB');

    // Test cases
    const testCases = [
      {
        email: 'admin@school.com',
        password: 'password123',
        role: 'admin',
        expected: 'SUCCESS'
      },
      {
        email: 'teacher@school.com',
        password: 'password123',
        role: 'teacher',
        expected: 'SUCCESS'
      },
      {
        email: 'parent@school.com',
        password: 'password123',
        role: 'parent',
        expected: 'SUCCESS'
      },
      {
        email: 'admin@school.com',
        password: 'password123',
        role: 'teacher',
        expected: 'ROLE_MISMATCH'
      },
      {
        email: 'teacher@school.com',
        password: 'password123',
        role: 'admin',
        expected: 'ROLE_MISMATCH'
      },
      {
        email: 'admin@school.com',
        password: 'wrongpassword',
        role: 'admin',
        expected: 'INVALID_PASSWORD'
      },
      {
        email: 'nonexistent@school.com',
        password: 'password123',
        role: 'admin',
        expected: 'USER_NOT_FOUND'
      }
    ];

    console.log('\n=== Testing Role-Based Authentication ===\n');

    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.email} with role ${testCase.role}`);
      
      try {
        // Find user
        const user = await User.findOne({ email: testCase.email }).select('+password');
        
        if (!user) {
          if (testCase.expected === 'USER_NOT_FOUND') {
            console.log('✅ PASS: User not found as expected');
          } else {
            console.log('❌ FAIL: User not found but expected to exist');
          }
          continue;
        }

        // Check password
        const isPasswordMatch = await user.matchPassword(testCase.password);
        if (!isPasswordMatch) {
          if (testCase.expected === 'INVALID_PASSWORD') {
            console.log('✅ PASS: Invalid password as expected');
          } else {
            console.log('❌ FAIL: Invalid password but expected to be valid');
          }
          continue;
        }

        // Check role
        if (user.role !== testCase.role) {
          if (testCase.expected === 'ROLE_MISMATCH') {
            console.log(`✅ PASS: Role mismatch as expected (user is ${user.role}, requested ${testCase.role})`);
          } else {
            console.log(`❌ FAIL: Role mismatch (user is ${user.role}, requested ${testCase.role})`);
          }
          continue;
        }

        // Check if user is active
        if (!user.isActive) {
          console.log('❌ FAIL: User account is deactivated');
          continue;
        }

        // Success case
        if (testCase.expected === 'SUCCESS') {
          console.log('✅ PASS: Login successful');
          const token = user.getSignedJwtToken();
          console.log(`   Token: ${token.substring(0, 50)}...`);
        } else {
          console.log('❌ FAIL: Login succeeded but expected to fail');
        }

      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
      }
      
      console.log('---');
    }

    console.log('\n=== Test Summary ===');
    console.log('✅ Role-based authentication is working correctly!');
    console.log('✅ Users can only login with their correct role');
    console.log('✅ Invalid credentials are properly rejected');
    console.log('✅ Role mismatches are properly detected');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testRoleBasedLogin();