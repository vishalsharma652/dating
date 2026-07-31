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

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: cleanUser,
      to: targetEmail,
      subject: 'Test Saathika Verification Code 123456',
      text: 'Your verification code is 123456',
      html: '<h2>Your verification code is <b>123456</b></h2>',
    });
    console.log('SUCCESS! MessageId:', info.messageId, 'Response:', info.response);
  } catch (err) {
    console.error('FAILED TO SEND EMAIL:', err);
  }
}

testEmail();
