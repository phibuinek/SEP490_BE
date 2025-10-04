require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Environment variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT_SET');
console.log('MAIL_FROM:', process.env.MAIL_FROM);

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('\nTesting SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.SMTP_USER,
      subject: 'Test Email - CareHome System',
      text: 'This is a test email from CareHome system.',
      html: '<h1>Test Email</h1><p>This is a test email from CareHome system.</p>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Check your email and app password.');
    }
  }
}

testEmail();
