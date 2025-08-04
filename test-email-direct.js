require('dotenv').config();

async function testEmailDirect() {
  console.log('📧 Testing Email Service Directly\n');
  
  try {
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
    console.log('SCHOOL_NAME:', process.env.SCHOOL_NAME || 'Not set');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('\n❌ Email configuration incomplete!');
      console.log('💡 Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
      return;
    }
    
    console.log('\n✅ Email configuration found!');
    
    // Test email service
    console.log('\n🧪 Testing email service...');
    const emailService = require('./backend/services/emailService');
    
    console.log('✅ Email service loaded successfully');
    
    // Test email sending
    console.log('📧 Sending test email...');
    const testEmailData = {
      name: 'Test Teacher',
      email: 'ankushrana830@gmail.com', // Send to the configured email
      designation: 'TGT',
      teacherId: 'TEST001'
    };
    
    try {
      await emailService.sendAdminPasswordResetEmail(testEmailData, 'testpassword123');
      console.log('✅ Email sent successfully!');
      console.log('📧 Check your inbox at:', testEmailData.email);
    } catch (emailError) {
      console.log('❌ Email sending failed:', emailError.message);
      
      if (emailError.code === 'EAUTH') {
        console.log('💡 Authentication failed. Check your email credentials.');
        console.log('   For Gmail, make sure you\'re using an App Password, not your regular password.');
      } else if (emailError.code === 'ECONNECTION') {
        console.log('💡 Connection failed. Check your internet connection.');
      } else {
        console.log('💡 Unknown error. Check the error message above.');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testEmailDirect().catch(console.error);