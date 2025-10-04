require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testing SMTP configuration for Render...');
console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT_SET');
console.log('MAIL_FROM:', process.env.MAIL_FROM);

async function testSmtp() {
  try {
    const port = parseInt(process.env.SMTP_PORT);
    const isSecure = port === 465;
    
    console.log(`\n📧 Creating transporter with port ${port}, secure: ${isSecure}`);
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP server is ready to take our messages');

    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'Test Email from Render - CareHome System',
      text: 'This is a test email from your Render deployment.',
      html: `
        <h1>Test Email from Render</h1>
        <p>This is a test email from your CareHome system deployed on Render.</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication failed. Possible issues:');
      console.error('1. Check if SMTP_PASS is correct (App Password, not regular password)');
      console.error('2. Enable 2-factor authentication on Gmail');
      console.error('3. Generate App Password: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🌐 Connection refused. Possible issues:');
      console.error('1. Check SMTP_HOST and SMTP_PORT');
      console.error('2. Check if Render allows outbound SMTP connections');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n⏰ Connection timeout. Possible issues:');
      console.error('1. Check network connectivity from Render');
      console.error('2. Try different SMTP_PORT (465 vs 587)');
    }
  }
}

testSmtp();
