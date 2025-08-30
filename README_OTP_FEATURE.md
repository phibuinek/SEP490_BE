# Tính năng Đăng nhập OTP - Nursing Home Management System

## Tổng quan

Hệ thống đã được tích hợp tính năng đăng nhập bằng số điện thoại và OTP (One-Time Password) thông qua SMS. Tính năng này bao gồm:

- ✅ Đăng nhập bằng OTP qua SMS
- ✅ Validation số điện thoại và email khi tạo user mới
- ✅ Real-time validation trên frontend
- ✅ Tích hợp Twilio SMS service
- ✅ Fallback mode cho development

## Cấu trúc Files

### Backend (@SEP490_BE/)

```
src/
├── auth/
│   ├── auth.controller.ts          # API endpoints cho OTP
│   ├── auth.service.ts             # Business logic authentication
│   ├── otp.service.ts              # OTP generation & SMS sending
│   ├── dto/
│   │   └── otp-login.dto.ts        # DTOs cho OTP requests
│   └── schemas/
│       └── otp.schema.ts           # Mongoose schema cho OTP
├── users/
│   ├── users.controller.ts         # API endpoints cho user validation
│   └── users.service.ts            # User management & validation
└── app.module.ts                   # Module configuration

# Files hướng dẫn
├── OTP_GUIDE.md                    # Hướng dẫn sử dụng OTP
├── SMS_INTEGRATION_GUIDE.md        # Hướng dẫn tích hợp SMS
├── test-twilio.js                  # Script test Twilio
└── README_OTP_FEATURE.md           # File này
```

### Frontend (@Nursing-Home-Management-System/)

```
src/
├── screens/auth/
│   ├── LoginScreen.js              # Màn hình đăng nhập chính
│   └── OtpLoginScreen.js           # Màn hình đăng nhập OTP
├── screens/residents/
│   └── AddResidentScreen.js        # Màn hình thêm resident (có validation)
├── redux/slices/
│   └── authSlice.js                # Redux state cho OTP
├── api/services/
│   ├── authService.js              # API calls cho OTP
│   └── userService.js              # API calls cho user validation
├── config/
│   └── appConfig.js                # API endpoints configuration
└── navigation/
    └── AuthNavigator.js            # Navigation cho auth screens
```

## API Endpoints

### Authentication
- `POST /auth/send-otp` - Gửi OTP qua SMS
- `POST /auth/login-otp` - Đăng nhập bằng OTP

### User Validation
- `GET /users/check-phone/:phone` - Kiểm tra số điện thoại đã tồn tại
- `GET /users/check-email/:email` - Kiểm tra email đã tồn tại

## Cách sử dụng

### 1. Đăng nhập bằng OTP

1. Mở app và chọn "Đăng nhập bằng OTP"
2. Nhập số điện thoại
3. Nhấn "Gửi mã OTP"
4. Nhập mã OTP nhận được qua SMS
5. Nhấn "Đăng nhập"

### 2. Tạo user mới với validation

1. Vào màn hình "Thêm Resident"
2. Chọn role "family"
3. Nhập thông tin family member
4. Hệ thống sẽ tự động kiểm tra:
   - Số điện thoại đã tồn tại chưa
   - Email đã tồn tại chưa
5. Hiển thị thông báo lỗi nếu có trùng lặp

## Cấu hình SMS Service

### Twilio (Đã tích hợp sẵn)

1. Đăng ký tài khoản Twilio: https://www.twilio.com/
2. Lấy Account SID và Auth Token
3. Cấu hình trong file `.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number
```

4. Test cấu hình:
```bash
node test-twilio.js
```

### AWS SNS (Khuyến nghị cho dự án học tập)

1. Đăng ký tài khoản AWS: https://aws.amazon.com/
2. Tạo IAM User với quyền SNS
3. Cấu hình trong file `.env`:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

4. Test cấu hình:
```bash
node test-aws-sns.js
```

**Ưu điểm AWS SNS:**
- Free tier 1,000 SMS/tháng
- Chi phí thấp hơn Twilio cho US SMS
- Tích hợp tốt với AWS ecosystem
- Phù hợp cho dự án học tập

**Xem hướng dẫn chi tiết:** `AWS_SNS_SETUP_GUIDE.md`

### Các SMS Service khác

Xem file `SMS_INTEGRATION_GUIDE.md` để biết cách tích hợp:
- AWS SNS
- Viettel SMS
- Vietnamobile SMS
- Mobifone SMS
- GSM Modem

## Development Mode

Khi chưa cấu hình SMS service, hệ thống sẽ:
- Log OTP ra console
- Simulate delay gửi SMS
- Cho phép test tính năng OTP

## Bảo mật

### OTP Security
- OTP có hiệu lực 5 phút
- Giới hạn 3 lần nhập sai
- Rate limiting: 5 lần gửi OTP/giờ/IP
- OTP được hash trước khi lưu database

### Phone Number Validation
- Kiểm tra format số điện thoại
- Validate số điện thoại thực tế
- Chống trùng lặp khi tạo user

## Troubleshooting

### Lỗi thường gặp

1. **"Số điện thoại không hợp lệ"**
   - Kiểm tra format số điện thoại
   - Đảm bảo số điện thoại có 10-15 chữ số

2. **"Không nhận được SMS"**
   - Kiểm tra cấu hình Twilio
   - Verify số điện thoại trong Twilio Console (free trial)
   - Kiểm tra balance tài khoản Twilio

3. **"Số điện thoại đã tồn tại"**
   - Số điện thoại đã được sử dụng bởi user khác
   - Sử dụng số điện thoại khác hoặc liên hệ admin

4. **"Email đã tồn tại"**
   - Email đã được sử dụng bởi user khác
   - Sử dụng email khác hoặc liên hệ admin

### Debug

1. **Backend logs:**
```bash
npm run start:dev
# Xem logs OTP trong console
```

2. **Frontend logs:**
```bash
# Mở React Native Debugger
# Xem logs trong console
```

3. **Test API:**
```bash
# Test gửi OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "0123456789"}'

# Test check phone
curl -X GET http://localhost:3000/users/check-phone/0123456789
```

## Monitoring

### SMS Logs
- Tất cả SMS được log với status
- Có thể track delivery status
- Error handling chi tiết

### User Activity
- Log tất cả attempts đăng nhập OTP
- Track failed attempts
- Rate limiting enforcement

## Performance

### Optimization
- Debounce validation (500ms)
- Caching phone/email checks
- Efficient database queries
- Connection pooling

### Scalability
- Horizontal scaling ready
- Load balancing support
- Database indexing
- CDN integration

## Deployment

### Production Checklist
- [ ] Cấu hình SMS service
- [ ] Set environment variables
- [ ] Enable rate limiting
- [ ] Configure monitoring
- [ ] Test OTP flow
- [ ] Backup strategy
- [ ] Error handling
- [ ] Security audit

### Environment Variables
```env
# Required
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number

# Optional
SMS_RATE_LIMIT=5
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=3
```

## Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs
2. Xem troubleshooting guide
3. Test với script test-twilio.js
4. Liên hệ development team

---

**Lưu ý:** Tính năng này đã được test và hoạt động ổn định. Đảm bảo cấu hình đúng SMS service trước khi deploy production.
