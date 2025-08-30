// Test script để kiểm tra AWS SNS SMS
require('dotenv').config();

const AWS = require('aws-sdk');

async function testAwsSNS() {
  // Kiểm tra environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    console.log('❌ Thiếu cấu hình AWS trong .env file');
    console.log('Vui lòng thêm:');
    console.log('AWS_ACCESS_KEY_ID=your_access_key_id');
    console.log('AWS_SECRET_ACCESS_KEY=your_secret_access_key');
    console.log('AWS_REGION=us-east-1');
    return;
  }

  console.log('✅ Cấu hình AWS đã sẵn sàng');
  console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...');
  console.log('Region:', process.env.AWS_REGION);

  // Cấu hình AWS
  AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

  const sns = new AWS.SNS();

  // Số điện thoại test (thay đổi thành số của bạn)
  const testPhone = '+84764634650'; // Thay đổi thành số điện thoại thật

  try {
    console.log(`📱 Đang gửi SMS test đến ${testPhone}...`);
    
    const params = {
      Message: 'Test SMS from AWS SNS - OTP system is working!',
      PhoneNumber: testPhone
    };

    const result = await sns.publish(params).promise();

    console.log('✅ SMS đã được gửi thành công!');
    console.log('Message ID:', result.MessageId);
    console.log('Status:', result.ResponseMetadata?.HTTPStatusCode);
    
  } catch (error) {
    console.log('❌ Lỗi khi gửi SMS:');
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
    
    if (error.code === 'InvalidParameter') {
      console.log('💡 Gợi ý: Số điện thoại không hợp lệ');
    } else if (error.code === 'OptInRequired') {
      console.log('💡 Gợi ý: Số điện thoại chưa được opt-in cho SMS');
    } else if (error.code === 'InvalidClientTokenId') {
      console.log('💡 Gợi ý: Access Key ID hoặc Secret Access Key không đúng');
    } else if (error.code === 'UnauthorizedOperation') {
      console.log('💡 Gợi ý: Không có quyền gửi SMS, kiểm tra IAM permissions');
    }
  }
}

// Chạy test
testAwsSNS();
