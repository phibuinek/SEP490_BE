require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testing both SMTP configurations...');
console.log('Current environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT_SET');
console.log('MAIL_FROM:', process.env.MAIL_FROM);

async function testSmtpConfig(port, description) {
  console.log(`\n📧 Testing ${description} (Port ${port})...`);
  
  try {
    const isSecure = port === 465;
    const config = {
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // For port 587, add TLS configuration
    if (port === 587) {
      config.requireTLS = true;
      config.tls = {
        rejectUnauthorized: false
      };
    }

    const transporter = nodemailer.createTransport(config);

    console.log(`🔌 Testing connection with port ${port}, secure: ${isSecure}...`);
    await transporter.verify();
    console.log(`✅ ${description} connection successful!`);

    console.log(`📤 Sending test email via ${description}...`);
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.SMTP_USER,
      subject: `Test Email - ${description}`,
      text: `This is a test email sent via ${description} (Port ${port})`,
      html: `
        <h1>Test Email - ${description}</h1>
        <p>This is a test email sent via <strong>${description}</strong> (Port ${port})</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        <p><strong>Protocol:</strong> ${isSecure ? 'SSL' : 'TLS'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });

    console.log(`✅ ${description} email sent successfully!`);
    console.log(`Message ID: ${info.messageId}`);
    
    return { success: true, port, description, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return { success: false, port, description, error: error.message, code: error.code };
  }
}

async function runTests() {
  const results = [];
  
  // Test both configurations
  results.push(await testSmtpConfig(465, 'SSL (Port 465)'));
  results.push(await testSmtpConfig(587, 'TLS (Port 587)'));
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.description}: SUCCESS (Message ID: ${result.messageId})`);
    } else {
      console.log(`❌ ${result.description}: FAILED (${result.error})`);
    }
  });
  
  const successfulConfigs = results.filter(r => r.success);
  if (successfulConfigs.length > 0) {
    console.log('\n🎉 Recommended configuration for Render:');
    const recommended = successfulConfigs.find(r => r.port === 587) || successfulConfigs[0];
    console.log(`   SMTP_PORT=${recommended.port}`);
    console.log(`   Protocol: ${recommended.port === 465 ? 'SSL' : 'TLS'}`);
  } else {
    console.log('\n⚠️  No working SMTP configuration found. Check your credentials.');
  }
}

runTests();
