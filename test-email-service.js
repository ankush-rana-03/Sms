require('dotenv').config({ path: './backend/.env' });
const emailService = require('./backend/services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service for Password Reset\n');
  
  try {
    // Test data
    const teacherData = {
      name: 'Test Teacher',
      email: 'ankushrana830@gmail.com', // Use the configured email
      designation: 'TGT',
      teacherId: 'T001'
    };
    
    const newPassword = 'testpassword123';
    
    console.log('📧 Sending test password reset email...');
    console.log('To:', teacherData.email);
    console.log('Teacher:', teacherData.name);
    console.log('New Password:', newPassword);
    
    // Test the email service
    const result = await emailService.sendAdminPasswordResetEmail(teacherData, newPassword);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('💡 Authentication error - check EMAIL_USER and EMAIL_PASSWORD in .env');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Connection error - check internet connection and email settings');
    }
  }
}

console.log('📋 Instructions:');
console.log('1. Make sure EMAIL_USER and EMAIL_PASSWORD are set in .env');
console.log('2. This will send a test password reset email');
console.log('3. Check the email inbox for the test message\n');

testEmailService().catch(console.error);