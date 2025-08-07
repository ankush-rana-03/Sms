require('dotenv').config({ path: './backend/.env' });
const emailService = require('./backend/services/emailService');

async function testPasswordChangeNotification() {
  console.log('🧪 Testing Password Change Notification Email\n');
  
  try {
    // Test data for a teacher changing their own password
    const userData = {
      name: 'Test Teacher',
      email: 'ankushrana830@gmail.com',
      role: 'teacher'
    };
    
    console.log('📧 Sending test password change notification email...');
    console.log('To:', userData.email);
    console.log('User:', userData.name);
    console.log('Role:', userData.role);
    
    // Test the email service
    const result = await emailService.sendPasswordChangeNotification(userData);
    
    console.log('✅ Password change notification email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    
  } catch (error) {
    console.error('❌ Error sending password change notification email:', error);
    console.error('Error details:', error.message);
  }
}

console.log('📋 Instructions:');
console.log('1. This will send a test password change notification email');
console.log('2. Check the email inbox for the test message');
console.log('3. This simulates when a teacher changes their own password\n');

testPasswordChangeNotification().catch(console.error);