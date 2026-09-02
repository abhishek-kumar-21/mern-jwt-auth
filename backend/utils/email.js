const nodemailer = require('nodemailer');
const dns = require('dns');

// CRITICAL FIX FOR RENDER: Force Node.js to use IPv4. 
// Render's network cannot route IPv6 to Gmail, which causes the ENETUNREACH and ETIMEDOUT errors.
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    logger: true, // Log all SMTP traffic
    debug: true,  // Show debug output
    // Sometimes Render struggles with IPv6 to Gmail, this can help:
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send an OTP email using Gmail
 */
const sendOtpEmail = async ({ to, name, otp, type }) => {
    const isVerification = type === 'email_verification';

    const subject = isVerification
        ? '🔐 Verify your email — OTP inside'
        : '🔑 Password Reset OTP';

    const heading = isVerification ? 'Verify Your Email' : 'Reset Your Password';
    const bodyText = isVerification
        ? 'Thanks for signing up! Use the OTP below to verify your email address.'
        : 'We received a request to reset your password. Use the code below to securely create a new one.';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #333;">
      <div style="background: #4F46E5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 22px;">${heading}</h1>
      </div>
      <div style="background: #f9f9f9; padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-top: 0;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 15px; color: #555;">${bodyText}</p>

        <div style="background: #fff; border: 2px dashed #4F46E5; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #888; letter-spacing: 1px; text-transform: uppercase;">Your OTP</p>
          <h2 style="margin: 0; font-size: 44px; letter-spacing: 14px; color: #4F46E5; font-family: monospace;">${otp}</h2>
        </div>

        <p style="font-size: 13px; color: #888; text-align: center;">
          ⏱️ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #bbb; text-align: center;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </div>`;

    console.log(`[sendOtpEmail] Attempting to send email to ${to}...`);
    try {
        const info = await transporter.sendMail({
            from: `"NodeApp Auth" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`[sendOtpEmail] Success! Message ID: ${info.messageId}`);
    } catch (err) {
        console.error(`[sendOtpEmail] CRITICAL ERROR sending email to ${to}:`, err);
        throw err;
    }
};

module.exports = { sendOtpEmail };
