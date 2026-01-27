import nodemailer from 'nodemailer';
import config from '../config';

async function sendEmailOtp(message: string, email: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email_user,
        pass: config.email_pass,
      },
    });

    // Professional HTML email template for AttendFlow
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; padding: 10px 0; }
          .header h1 { color: #1a73e8; font-size: 24px; margin: 0; }
          .content { padding: 20px; text-align: center; }
          .otp { font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px; margin: 20px 0; }
          .message { font-size: 16px; color: #555; line-height: 1.5; }
          .footer { text-align: center; font-size: 12px; color: #999; padding: 10px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AttendFlow</h1>
          </div>
          <div class="content">
            <h2>Your One-Time Password (OTP)</h2>
            <p class="message">Please use the following OTP to complete your action. This code is valid for 2.5 minutes.</p>
            <div class="otp">${message}</div>
            <p class="message">If you did not request this OTP, please ignore this email or contact our support team.</p>
            <a href="https://attendflow.com/support" class="button">Contact Support</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AttendFlow. All rights reserved.</p>
            <p>Your Campus, Smart Attendance Management</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email options
    const mailOptions = {
      from: `"AttendFlow" <${config.email_user}>`,
      to: email,
      subject: 'Your AttendFlow OTP Code',
      text: `Your OTP code is ${message}. It is valid for 10 minutes. If you did not request this, please contact support at https://attendflow.com/support.`,
      html: htmlTemplate,
    };
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export default sendEmailOtp;
