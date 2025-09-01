// Test script để kiểm tra Twilio SMS
require('dotenv').config();

const twilio = require('twilio');

async function testTwilioSMS() {
  // Kiểm tra environment variables
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.log('❌ Thiếu cấu hình Twilio trong .env file');
    console.log('Vui lòng thêm:');
    console.log('TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('TWILIO_FROM_NUMBER=your_twilio_phone_number');
    return;
  }

  console.log('✅ Cấu hình Twilio đã sẵn sàng');
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...');
  console.log('From Number:', process.env.TWILIO_FROM_NUMBER);

  // Tạo Twilio client
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // Số điện thoại test (thay đổi thành số của bạn)
  const testPhone = '+84123456789'; // Thay đổi thành số điện thoại thật

  try {
    console.log(`📱 Đang gửi SMS test đến ${testPhone}...`);
    
    const message = await client.messages.create({
      body: 'Test SMS từ Twilio - Hệ thống OTP đã hoạt động!',
      from: process.env.TWILIO_FROM_NUMBER,
      to: testPhone
    });

    console.log('✅ SMS đã được gửi thành công!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    
  } catch (error) {
    console.log('❌ Lỗi khi gửi SMS:');
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
    
    if (error.code === 21211) {
      console.log('💡 Gợi ý: Số điện thoại không hợp lệ');
    } else if (error.code === 21214) {
      console.log('💡 Gợi ý: Số điện thoại chưa được verify (free trial)');
    } else if (error.code === 20003) {
      console.log('💡 Gợi ý: Account SID hoặc Auth Token không đúng');
    }
  }
}

// Chạy test
testTwilioSMS();




