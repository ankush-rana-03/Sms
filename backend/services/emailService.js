const nodemailer = require('nodemailer');

// Email service for sending notifications
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send welcome email to newly registered teacher
  async sendTeacherWelcomeEmail(teacherData, temporaryPassword) {
    try {
      const {
        name,
        email,
        designation,
        teacherId,
        joiningDate
      } = teacherData;

      const loginUrl = process.env.FRONTEND_URL || 'https://school-management-app-demo.netlify.app';
      
      const mailOptions = {
        from: `"${process.env.SCHOOL_NAME || 'School Management System'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Welcome to ${process.env.SCHOOL_NAME || 'Our School'} - Your Account Details`,
        html: this.generateTeacherWelcomeEmailHTML({
          name,
          email,
          designation,
          teacherId,
          joiningDate,
          temporaryPassword,
          loginUrl
        })
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully to:', email);
      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  // Generate HTML content for teacher welcome email
  generateTeacherWelcomeEmailHTML(data) {
    const {
      name,
      email,
      designation,
      teacherId,
      joiningDate,
      temporaryPassword,
      loginUrl
    } = data;

    const formattedDate = new Date(joiningDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Our School</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            color: #2E7D32;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .welcome-message {
            font-size: 18px;
            color: #666;
          }
          .teacher-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4CAF50;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-value {
            color: #333;
          }
          .login-section {
            background-color: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .login-button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 0;
            transition: background-color 0.3s;
          }
          .login-button:hover {
            background-color: #45a049;
          }
          .password-box {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            text-align: center;
          }
          .password-text {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #856404;
            letter-spacing: 2px;
          }
          .important-note {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .contact-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="school-name">${process.env.SCHOOL_NAME || 'School Management System'}</div>
            <div class="welcome-message">🎓 Welcome to Our Educational Family!</div>
          </div>

          <p>Dear <strong>${name}</strong>,</p>

          <p>We are delighted to welcome you to <strong>${process.env.SCHOOL_NAME || 'our school'}</strong>! It gives us great pleasure to have you join our dedicated team of educators who are committed to shaping the future of our students.</p>

          <p>Your journey with us begins on <strong>${formattedDate}</strong>, and we are confident that your expertise and passion for teaching will make a significant impact on our students' lives.</p>

          <div class="teacher-info">
            <h3 style="color: #2E7D32; margin-top: 0;">Your Account Information</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Teacher ID:</span>
              <span class="info-value">${teacherId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Designation:</span>
              <span class="info-value">${designation}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Joining Date:</span>
              <span class="info-value">${formattedDate}</span>
            </div>
          </div>

          <div class="login-section">
            <h3 style="color: #2E7D32; margin-top: 0;">🔐 Access Your Account</h3>
            <p>You can now access the School Management System using the credentials below:</p>
            
            <div class="password-box">
              <strong>Temporary Password:</strong><br>
              <span class="password-text">${temporaryPassword}</span>
            </div>

            <a href="${loginUrl}" class="login-button">Login to School Management System</a>
          </div>

          <div class="important-note">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Important Security Notice</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This is your temporary password. You will be required to change it on your first login.</li>
              <li>Please keep your login credentials secure and do not share them with anyone.</li>
              <li>If you have any issues accessing your account, please contact the IT department.</li>
            </ul>
          </div>

          <h3 style="color: #2E7D32;">🎯 What's Next?</h3>
          <ul>
            <li><strong>Complete Your Profile:</strong> Update your personal information and preferences</li>
            <li><strong>Review School Policies:</strong> Familiarize yourself with our educational policies and procedures</li>
            <li><strong>Connect with Colleagues:</strong> Meet your fellow teachers and administrative staff</li>
            <li><strong>Access Resources:</strong> Explore teaching materials and administrative tools</li>
          </ul>

          <div class="contact-info">
            <h4 style="color: #2E7D32; margin-top: 0;">📞 Need Help?</h4>
            <p>If you have any questions or need assistance, please don't hesitate to reach out:</p>
            <p><strong>IT Support:</strong> ${process.env.IT_EMAIL || 'it@school.com'}</p>
            <p><strong>Administration:</strong> ${process.env.ADMIN_EMAIL || 'admin@school.com'}</p>
          </div>

          <p>Once again, welcome to our school family! We look forward to working together to provide the best educational experience for our students.</p>

          <p>Best regards,<br>
          <strong>${process.env.SCHOOL_NAME || 'School Management System'} Administration</strong></p>

          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${process.env.SCHOOL_NAME || 'School Management System'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'https://school-management-app-demo.netlify.app'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"${process.env.SCHOOL_NAME || 'School Management System'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request - School Management System',
        html: this.generatePasswordResetEmailHTML(resetUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully to:', email);
      return result;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Generate HTML content for password reset email
  generatePasswordResetEmailHTML(resetUrl) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .reset-button {
            display: inline-block;
            background-color: #2196F3;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #2196F3;">Password Reset Request</h2>
          </div>
          
          <p>You have requested to reset your password for the School Management System.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </div>
          
          <p><strong>Note:</strong> This link will expire in 10 minutes for security reasons.</p>
          
          <p>If you did not request this password reset, please ignore this email.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} School Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
