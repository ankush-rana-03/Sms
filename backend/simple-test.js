const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Test users data
const testUsers = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@school.com",
    password: "$2b$10$691Mfia36GX5irwsTE91GOcd2sPx8yaQFDcldvh95KnOvi310XnjC",
    role: "admin",
    phone: "1234567890",
    address: "123 Admin St",
    isActive: true,
    emailVerified: true
  },
  {
    id: "2",
    name: "Teacher User",
    email: "teacher@school.com",
    password: "$2b$10$691Mfia36GX5irwsTE91GOcd2sPx8yaQFDcldvh95KnOvi310XnjC",
    role: "teacher",
    phone: "1234567891",
    address: "456 Teacher St",
    isActive: true,
    emailVerified: true
  },
  {
    id: "3",
    name: "Parent User",
    email: "parent@school.com",
    password: "$2b$10$691Mfia36GX5irwsTE91GOcd2sPx8yaQFDcldvh95KnOvi310XnjC",
    role: "parent",
    phone: "1234567893",
    address: "321 Parent St",
    isActive: true,
    emailVerified: true
  }
];

async function testLogin(email, password, role) {
  console.log(`\nTesting login: ${email} with role: ${role}`);
  
  // Find user
  const user = testUsers.find(u => u.email === email);
  if (!user) {
    console.log('❌ User not found');
    return false;
  }
  
  // Check role
  if (user.role !== role) {
    console.log(`❌ Role mismatch. Expected: ${user.role}, Got: ${role}`);
    return false;
  }
  
  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    console.log('❌ Invalid password');
    return false;
  }
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    'your_jwt_secret_key_here_make_it_long_and_secure_123456789',
    { expiresIn: '30d' }
  );
  
  console.log('✅ Login successful!');
  console.log(`User: ${user.name}`);
  console.log(`Role: ${user.role}`);
  console.log(`Token: ${token.substring(0, 50)}...`);
  
  return true;
}

async function runTests() {
  console.log('🧪 Testing Login Functionality\n');
  
  // Test successful logins
  await testLogin('admin@school.com', 'password123', 'admin');
  await testLogin('teacher@school.com', 'password123', 'teacher');
  await testLogin('parent@school.com', 'password123', 'parent');
  
  // Test failed logins
  console.log('\n🧪 Testing Failed Login Scenarios\n');
  
  await testLogin('admin@school.com', 'wrongpassword', 'admin');
  await testLogin('admin@school.com', 'password123', 'teacher');
  await testLogin('nonexistent@school.com', 'password123', 'admin');
  
  console.log('\n✅ Login testing completed!');
}

runTests();