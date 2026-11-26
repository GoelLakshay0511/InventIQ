/**
 * Email Service — sends transactional emails via Nodemailer.
 *
 * DEVELOPMENT FALLBACK:
 *   If SMTP_USER / SMTP_PASS are not set in .env, the OTP is printed
 *   to the server console instead of being emailed. This lets you test
 *   the full registration flow without any email account setup.
 *
 * PRODUCTION:
 *   Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and
 *   EMAIL_FROM in your .env to send real emails.
 *   Works with Gmail App Passwords, SendGrid, Brevo, Mailgun, etc.
 */

const nodemailer = require('nodemailer');

/** Returns true when real SMTP credentials are configured. */
function isSMTPConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Build a reusable SMTP transporter (lazy-init). */
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.replace(/\s+/g, ''),
    },
  });

  return _transporter;
}

/**
 * Build the HTML body for the OTP email.
 */
function buildOtpEmailHtml(otp, storeName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your InventIQ account</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header accent bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#16a34a,#4ade80,#34d399);"></td></tr>

        <!-- Logo + heading -->
        <tr><td style="padding:36px 40px 20px;text-align:center;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#15803d,#22c55e);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">📦</div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Verify your email</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">
            ${storeName ? `Welcome, ${storeName}! ` : ''}Use the code below to complete your InventIQ registration.
          </p>
        </td></tr>

        <!-- OTP box -->
        <tr><td style="padding:8px 40px 32px;text-align:center;">
          <div style="display:inline-block;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px 36px;margin:8px 0;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#16a34a;letter-spacing:0.08em;text-transform:uppercase;">Your verification code</p>
            <p style="margin:0;font-size:40px;font-weight:800;color:#14532d;letter-spacing:0.25em;font-family:'Courier New',monospace;">${otp}</p>
          </div>
          <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">This code expires in <strong>10 minutes</strong>.</p>
        </td></tr>

        <!-- Warning -->
        <tr><td style="padding:0 40px 32px;">
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
            <p style="margin:0;font-size:12.5px;color:#92400e;">
              🔒 <strong>Never share this code.</strong> InventIQ will never ask for it over phone or chat. If you didn't request this, ignore this email.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            © 2026 InventIQ Technologies Inc. · All rights reserved
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send a 6-digit OTP verification email.
 *
 * @param {string} toEmail    - Recipient email address
 * @param {string} otp        - Plain-text OTP (6 digits)
 * @param {string} [storeName]- Optional store name for personalisation
 */
async function sendOtpEmail(toEmail, otp, storeName = '') {
  if (!isSMTPConfigured()) {
    // ── DEVELOPMENT FALLBACK ──────────────────────────────────────────────────
    // No SMTP configured → print to console so you can test without email setup
    console.log('\n' + '═'.repeat(60));
    console.log('  📧  EMAIL VERIFICATION OTP  (Dev Mode — no SMTP set)');
    console.log('═'.repeat(60));
    console.log(`  To      : ${toEmail}`);
    console.log(`  Store   : ${storeName || 'N/A'}`);
    console.log(`  OTP Code: \x1b[32m\x1b[1m ${otp} \x1b[0m`);
    console.log(`  Expires : 10 minutes from now`);
    console.log('═'.repeat(60));
    console.log('  To send real emails, add SMTP_USER & SMTP_PASS to .env');
    console.log('═'.repeat(60) + '\n');
    return { messageId: 'console-fallback', previewUrl: null };
  }

  // ── REAL EMAIL ────────────────────────────────────────────────────────────
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"InventIQ" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${otp} is your InventIQ verification code`,
    text: `Your InventIQ verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: buildOtpEmailHtml(otp, storeName),
  });

  console.log(`📧 OTP email sent to ${toEmail} [messageId: ${info.messageId}]`);
  return { messageId: info.messageId, previewUrl: null };
}

/**
 * Build the HTML body for the password reset OTP email.
 */
function buildPasswordResetEmailHtml(otp, userName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your InventIQ password</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header accent bar -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#16a34a,#4ade80,#34d399);"></td></tr>

        <!-- Logo + heading -->
        <tr><td style="padding:36px 40px 20px;text-align:center;">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#15803d,#22c55e);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">📦</div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.02em;">Reset your password</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">
            ${userName ? `Hi ${userName}, ` : ''}use the code below to reset your InventIQ account password.
          </p>
        </td></tr>

        <!-- OTP box -->
        <tr><td style="padding:8px 40px 32px;text-align:center;">
          <div style="display:inline-block;background:#fef2f2;border:2px solid #fecaca;border-radius:12px;padding:20px 36px;margin:8px 0;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#dc2626;letter-spacing:0.08em;text-transform:uppercase;">Password reset code</p>
            <p style="margin:0;font-size:40px;font-weight:800;color:#7f1d1d;letter-spacing:0.25em;font-family:'Courier New',monospace;">${otp}</p>
          </div>
          <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">This code expires in <strong>10 minutes</strong>.</p>
        </td></tr>

        <!-- Warning -->
        <tr><td style="padding:0 40px 32px;">
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
            <p style="margin:0;font-size:12.5px;color:#92400e;">
              🔒 <strong>Never share this code.</strong> If you did not request a password reset, your account may be at risk — change your password immediately.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            © 2026 InventIQ Technologies Inc. · All rights reserved
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send a password reset OTP email.
 *
 * @param {string} toEmail  - Recipient email address
 * @param {string} otp      - Plain-text OTP (6 digits)
 * @param {string} [userName] - Optional user name for personalisation
 */
async function sendPasswordResetEmail(toEmail, otp, userName = '') {
  if (!isSMTPConfigured()) {
    console.log('\n' + '═'.repeat(60));
    console.log('  🔑  PASSWORD RESET OTP  (Dev Mode — no SMTP set)');
    console.log('═'.repeat(60));
    console.log(`  To      : ${toEmail}`);
    console.log(`  User    : ${userName || 'N/A'}`);
    console.log(`  OTP Code: \x1b[31m\x1b[1m ${otp} \x1b[0m`);
    console.log(`  Expires : 10 minutes from now`);
    console.log('═'.repeat(60) + '\n');
    return { messageId: 'console-fallback', previewUrl: null };
  }

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"InventIQ" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${otp} — InventIQ password reset code`,
    text: `Your InventIQ password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.`,
    html: buildPasswordResetEmailHtml(otp, userName),
  });

  console.log(`🔑 Password reset OTP sent to ${toEmail} [messageId: ${info.messageId}]`);
  return { messageId: info.messageId, previewUrl: null };
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, isSMTPConfigured };
