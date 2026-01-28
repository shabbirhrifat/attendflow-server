import nodemailer from 'nodemailer';
import config from '../config';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.email_user,
            pass: config.email_pass,
        },
    });
};

// Common email header/footer
const emailHeader = `
    <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0;">
        <h1 style="color: #1a73e8; margin: 0; font-size: 24px;">AttendFlow</h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Smart Attendance Management System</p>
    </div>
`;

const emailFooter = `
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; margin-top: 30px;">
        <p style="color: #999; font-size: 12px; margin: 5px 0;">&copy; ${new Date().getFullYear()} AttendFlow. All rights reserved.</p>
        <p style="color: #999; font-size: 12px; margin: 5px 0;">Your Campus, Smart Attendance Management</p>
        <p style="font-size: 12px;">
            <a href="https://attendflow.com/support" style="color: #1a73e8; text-decoration: none;">Contact Support</a> |
            <a href="https://attendflow.com/privacy" style="color: #1a73e8; text-decoration: none;">Privacy Policy</a>
        </p>
    </div>
`;

const emailWrapper = (content: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AttendFlow</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            ${emailHeader}
            <div style="padding: 30px;">
                ${content}
            </div>
            ${emailFooter}
        </div>
    </body>
    </html>
`;

// Send email function
const sendEmail = async (options: EmailOptions): Promise<void> => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"AttendFlow" <${config.email_user}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

// ==================== EMAIL TEMPLATES ====================

/**
 * Send OTP email (for verification or two-factor authentication)
 */
export const sendOTPEmail = async (email: string, otp: string, purpose: 'verification' | 'login' = 'verification'): Promise<void> => {
    const purposeText = purpose === 'verification' ? 'verify your email address' : 'complete your sign-in';
    const validityMinutes = 10;

    const content = `
        <div style="text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Your One-Time Password (OTP)</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">Please use the following OTP to ${purposeText}:</p>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; margin: 30px auto; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                ${otp}
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">This code is valid for <strong>${validityMinutes} minutes</strong>.</p>

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; text-align: left;">
                <p style="color: #856404; margin: 0; font-size: 14px;"><strong>Important:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.</p>
            </div>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">If you did not request this OTP, please ignore this email or contact our support team.</p>
        </div>
    `;

    const textContent = `Your AttendFlow OTP is: ${otp}\n\nThis code is valid for ${validityMinutes} minutes.\n\nIf you did not request this OTP, please ignore this email.`;

    await sendEmail({
        to: email,
        subject: `AttendFlow - Your OTP Code`,
        text: textContent,
        html: emailWrapper(content),
    });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, resetLink: string, userName: string = ''): Promise<void> => {
    const content = `
        <div style="text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>

            ${userName ? `<p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>` : '<p style="color: #666; font-size: 16px;">Hello,</p>'}

            <p style="color: #666; font-size: 16px; line-height: 1.6;">We received a request to reset your password for your AttendFlow account.</p>

            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 30px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Reset My Password
            </a>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">Or copy and paste this link into your browser:</p>
            <p style="color: #1a73e8; font-size: 12px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0;">${resetLink}</p>

            <p style="color: #666; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>

            <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 30px 0; text-align: left;">
                <p style="color: #0d47a1; margin: 0; font-size: 14px;"><strong>Security Tip:</strong> Always choose a strong password with a mix of letters, numbers, and symbols.</p>
            </div>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">If you did not request a password reset, please ignore this email or contact support immediately.</p>
        </div>
    `;

    const textContent = `Reset your AttendFlow password by clicking the link below:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`;

    await sendEmail({
        to: email,
        subject: 'AttendFlow - Reset Your Password',
        text: textContent,
        html: emailWrapper(content),
    });
};

/**
 * Send email verification email
 */
export const sendEmailVerificationEmail = async (email: string, verificationLink: string, userName: string = ''): Promise<void> => {
    const content = `
        <div style="text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>

            ${userName ? `<p style="color: #666; font-size: 16px;">Welcome to AttendFlow, <strong>${userName}</strong>!</p>` : '<p style="color: #666; font-size: 16px;">Welcome to AttendFlow!</p>'}

            <p style="color: #666; font-size: 16px; line-height: 1.6;">Please verify your email address to complete your registration and unlock full access to AttendFlow.</p>

            <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 30px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Verify Email Address
            </a>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">Or copy and paste this link into your browser:</p>
            <p style="color: #1a73e8; font-size: 12px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0;">${verificationLink}</p>

            <p style="color: #666; font-size: 14px;">This link will expire in <strong>24 hours</strong>.</p>

            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 30px 0; text-align: left;">
                <p style="color: #2e7d32; margin: 0; font-size: 14px;"><strong>Why verify?</strong> Email verification helps protect your account and ensures you receive important notifications.</p>
            </div>

            <p style="color: #999; font-size: 14px; margin-top: 30px;">If you did not create an AttendFlow account, please ignore this email.</p>
        </div>
    `;

    const textContent = `Verify your AttendFlow email address by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`;

    await sendEmail({
        to: email,
        subject: 'AttendFlow - Verify Your Email Address',
        text: textContent,
        html: emailWrapper(content),
    });
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email: string, userName: string, loginLink: string): Promise<void> => {
    const content = `
        <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to AttendFlow!</h2>

            <p style="color: #666; font-size: 16px;">Hello <strong>${userName}</strong>,</p>

            <p style="color: #666; font-size: 16px; line-height: 1.6;">Your account has been successfully created! You can now start using AttendFlow to manage attendance efficiently.</p>

            <a href="${loginLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 30px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Get Started
            </a>

            <div style="text-align: left; margin: 40px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
                <ul style="color: #666; line-height: 1.8;">
                    <li>Complete your profile information</li>
                    <li>Explore your dashboard</li>
                    <li>Check out the attendance features</li>
                    <li>Contact support if you need help</li>
                </ul>
            </div>

            <p style="color: #999; font-size: 14px;">We're excited to have you on board!</p>
        </div>
    `;

    const textContent = `Welcome to AttendFlow, ${userName}!\n\nYour account has been created successfully. Visit ${loginLink} to get started.\n\nWe're excited to have you on board!`;

    await sendEmail({
        to: email,
        subject: 'Welcome to AttendFlow!',
        text: textContent,
        html: emailWrapper(content),
    });
};

/**
 * Send attendance reminder email
 */
export const sendAttendanceReminderEmail = async (
    email: string,
    studentName: string,
    courseName: string,
    attendancePercentage: number
): Promise<void> => {
    const isLowAttendance = attendancePercentage < 75;
    const bgColor = isLowAttendance ? '#fff3cd' : '#e8f5e9';
    const borderColor = isLowAttendance ? '#ffc107' : '#4caf50';
    const textColor = isLowAttendance ? '#856404' : '#2e7d32';

    const content = `
        <div style="text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Attendance Reminder</h2>

            <p style="color: #666; font-size: 16px;">Dear <strong>${studentName}</strong>,</p>

            <p style="color: #666; font-size: 16px; line-height: 1.6;">This is a reminder about your attendance record for <strong>${courseName}</strong>.</p>

            <div style="background: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 20px; margin: 30px 0;">
                <p style="color: ${textColor}; font-size: 14px; margin: 0 0 10px 0;"><strong>Current Attendance: ${attendancePercentage}%</strong></p>
                <p style="color: ${textColor}; font-size: 14px; margin: 0;">${isLowAttendance ? 'Your attendance is below the required threshold. Please ensure you attend upcoming classes.' : 'Your attendance is good. Keep it up!'}</p>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you have any concerns about your attendance, please contact your course instructor or the administration office.</p>
        </div>
    `;

    const textContent = `Attendance Reminder for ${courseName}\n\nDear ${studentName},\n\nYour current attendance is ${attendancePercentage}%. ${isLowAttendance ? 'Your attendance is below the required threshold. Please ensure you attend upcoming classes.' : 'Your attendance is good. Keep it up!'}\n\nIf you have any concerns, please contact your course instructor.`;

    await sendEmail({
        to: email,
        subject: `AttendFlow - Attendance Reminder for ${courseName}`,
        text: textContent,
        html: emailWrapper(content),
    });
};

/**
 * Send leave request notification
 */
export const sendLeaveRequestNotification = async (
    email: string,
    recipientName: string,
    studentName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    reason: string
): Promise<void> => {
    const content = `
        <div style="text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">New Leave Request</h2>

            <p style="color: #666; font-size: 16px;">Dear <strong>${recipientName}</strong>,</p>

            <p style="color: #666; font-size: 16px; line-height: 1.6;">A new leave request has been submitted and requires your approval.</p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; color: #666; font-weight: 600;">Student:</td>
                        <td style="padding: 10px; color: #333;">${studentName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; color: #666; font-weight: 600;">Leave Type:</td>
                        <td style="padding: 10px; color: #333;">${leaveType}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; color: #666; font-weight: 600;">From:</td>
                        <td style="padding: 10px; color: #333;">${startDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; color: #666; font-weight: 600;">To:</td>
                        <td style="padding: 10px; color: #333;">${endDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; color: #666; font-weight: 600;">Reason:</td>
                        <td style="padding: 10px; color: #333;">${reason}</td>
                    </tr>
                </table>
            </div>

            <p style="color: #666; font-size: 14px;">Please log in to AttendFlow to review and approve/reject this request.</p>
        </div>
    `;

    const textContent = `New Leave Request\n\nStudent: ${studentName}\nLeave Type: ${leaveType}\nFrom: ${startDate}\nTo: ${endDate}\nReason: ${reason}\n\nPlease log in to AttendFlow to review this request.`;

    await sendEmail({
        to: email,
        subject: `AttendFlow - Leave Request from ${studentName}`,
        text: textContent,
        html: emailWrapper(content),
    });
};

// Legacy support for existing sendEmailOtp function
export const sendEmailOtp = async (message: string, email: string): Promise<void> => {
    // If message is just an OTP code (6 digits), use the new template
    if (/^\d{6}$/.test(message.trim())) {
        await sendOTPEmail(email, message.trim());
        return;
    }

    // Otherwise, send as plain message (for reset links, etc.)
    const content = `
        <div style="text-align: center;">
            <p style="color: #666; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
    `;

    await sendEmail({
        to: email,
        subject: 'AttendFlow Notification',
        text: message,
        html: emailWrapper(content),
    });
};

export default {
    sendOTPEmail,
    sendPasswordResetEmail,
    sendEmailVerificationEmail,
    sendWelcomeEmail,
    sendAttendanceReminderEmail,
    sendLeaveRequestNotification,
    sendEmailOtp,
};
