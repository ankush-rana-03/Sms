const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Generate email template for parent credentials
const generateParentCredentialsEmail = (parentName, studentName, email, password, schoolName = 'School Management System') => {
  return {
    subject: `Welcome to ${schoolName} - Parent Login Credentials`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parent Login Credentials</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
          }
          .credentials-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 10px 0;
            padding: 10px;
            background-color: #ffffff;
            border-left: 4px solid #007bff;
            border-radius: 3px;
          }
          .label {
            font-weight: bold;
            color: #495057;
          }
          .value {
            color: #007bff;
            font-family: monospace;
            font-size: 16px;
          }
          .instructions {
            background-color: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${schoolName}</div>
            <p>Parent Portal Access</p>
          </div>
          
          <h2>Dear ${parentName},</h2>
          
          <p>Welcome to ${schoolName}! Your parent account has been created for your child <strong>${studentName}</strong>.</p>
          
          <div class="credentials-box">
            <h3>Your Login Credentials:</h3>
            <div class="credential-item">
              <span class="label">Email:</span><br>
              <span class="value">${email}</span>
            </div>
            <div class="credential-item">
              <span class="label">Password:</span><br>
              <span class="value">${password}</span>
            </div>
          </div>
          
          <div class="instructions">
            <h3>How to Access:</h3>
            <ol>
              <li>Visit the school portal website</li>
              <li>Click on "Parent Login"</li>
              <li>Enter your email and password above</li>
              <li>You can view your child's attendance, homework, and other information</li>
            </ol>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> Please keep your login credentials secure and do not share them with others. 
            You can change your password after your first login.
          </div>
          
          <p>If you have any questions or need assistance, please contact the school administration.</p>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Dear ${parentName},

Welcome to ${schoolName}! Your parent account has been created for your child ${studentName}.

Your Login Credentials:
Email: ${email}
Password: ${password}

How to Access:
1. Visit the school portal website
2. Click on "Parent Login"
3. Enter your email and password above
4. You can view your child's attendance, homework, and other information

Important: Please keep your login credentials secure and do not share them with others. 
You can change your password after your first login.

If you have any questions or need assistance, please contact the school administration.

This is an automated message. Please do not reply to this email.

© ${new Date().getFullYear()} ${schoolName}. All rights reserved.
    `
  };
};

// Send parent credentials email
const sendParentCredentials = async (parentUserId, studentName) => {
  try {
    const parent = await User.findById(parentUserId);
    if (!parent) {
      throw new Error('Parent user not found');
    }

    const transporter = createTransporter();
    const emailContent = generateParentCredentialsEmail(
      parent.name,
      studentName,
      parent.email,
      'Your password was set during account creation', // We don't store plain text passwords
      process.env.SCHOOL_NAME || 'School Management System'
    );

    const mailOptions = {
      from: `"${process.env.SCHOOL_NAME || 'School Management System'}" <${process.env.EMAIL_USER}>`,
      to: parent.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Parent credentials email sent to ${parent.email}:`, result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      email: parent.email
    };

  } catch (error) {
    console.error('Error sending parent credentials email:', error);
    throw error;
  }
};

// Send credentials to all parents
const sendCredentialsToAllParents = async () => {
  try {
    const parents = await User.find({ role: 'parent' });
    const results = {
      sent: 0,
      failed: 0,
      details: []
    };

    for (const parent of parents) {
      try {
        // Find the student associated with this parent
        const Student = require('../models/Student');
        const student = await Student.findOne({ parent: parent._id });
        
        if (student) {
          await sendParentCredentials(parent._id, student.name);
          results.sent++;
          results.details.push({
            parent: parent.name,
            email: parent.email,
            student: student.name,
            status: 'sent'
          });
        } else {
          console.log(`No student found for parent ${parent.name}`);
          results.failed++;
          results.details.push({
            parent: parent.name,
            email: parent.email,
            status: 'no_student_found'
          });
        }
      } catch (error) {
        console.error(`Failed to send email to ${parent.email}:`, error.message);
        results.failed++;
        results.details.push({
          parent: parent.name,
          email: parent.email,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error sending credentials to all parents:', error);
    throw error;
  }
};

module.exports = {
  sendParentCredentials,
  sendCredentialsToAllParents,
  generateParentCredentialsEmail
};