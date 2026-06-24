const nodemailer = require('nodemailer');

/**
 * Reusable transporter for sending transactional emails
 * (low attendance alerts, welcome emails, password resets, etc.)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email. Wrapped in try/catch upstream so a mail failure
 * never crashes the main request flow (attendance marking, etc.)
 */
const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
  return info;
};

module.exports = { transporter, sendEmail };
