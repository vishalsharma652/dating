const nodemailer = require('nodemailer');
require('dotenv').config({ path: __dirname + '/.env' });

async function testEmail() {
  const cleanUser = String(process.env.SMTP_USER || '').replace(/["'\s]/g, '');
  const cleanPass = String(process.env.SMTP_PASS || '').replace(/["'\s]/g, '');
  const targetEmail = process.argv[2] || cleanUser;

  if (!cleanUser || !cleanPass) {
    console.error('Error: SMTP_USER or SMTP_PASS missing in .env');
    process.exit(1);
  }

  console.log('Testing SMTP Sender:', cleanUser, '| Target Recipient:', targetEmail);

  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Saathika Verification" <${cleanUser}>`,
      to: targetEmail,
      replyTo: cleanUser,
      headers: {
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Auto-Submitted': 'auto-generated',
        'X-Priority': '1',
        'Importance': 'high',
      },
      subject: 'Your Saathika verification code: 654321',
      text: 'Hi,\n\nYour Saathika verification code is: 654321\n\nThis code expires in 3 minutes.',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background-color:#4f46e5;padding:24px 32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700">Saathika Verification</h1>
          </div>
          <div style="padding:32px 24px;background-color:#ffffff">
            <p style="color:#1f2937;font-size:15px">Hi there,</p>
            <p style="color:#4b5563;font-size:14px">Your one-time email verification code for Saathika is:</p>
            <div style="text-align:center;margin:24px 0">
              <span style="display:inline-block;background-color:#f3f4f6;border:1px solid #d1d5db;border-radius:8px;padding:14px 28px;font-size:32px;font-weight:700;letter-spacing:8px;color:#111827">654321</span>
            </div>
            <p style="color:#6b7280;font-size:13px">This code expires in 3 minutes. Do not share this code with anyone.</p>
          </div>
        </div>
      `,
    });
    console.log('SUCCESS! MessageId:', info.messageId, 'Response:', info.response);
  } catch (err) {
    console.error('FAILED TO SEND EMAIL:', err);
  }
}

testEmail();
