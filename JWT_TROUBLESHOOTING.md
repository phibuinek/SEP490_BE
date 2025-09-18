# JWT Authentication Troubleshooting Guide

## Lỗi: UnauthorizedException - Unauthorized

### Nguyên nhân có thể:

1. **JWT Token không hợp lệ hoặc hết hạn**
2. **Thiếu Authorization header**
3. **JWT_SECRET không đúng hoặc chưa được cấu hình**
4. **Token format không đúng**

### Cách khắc phục:

#### 1. Kiểm tra JWT Configuration
```bash
# Gọi endpoint debug để kiểm tra cấu hình JWT
GET /auth/debug/jwt-info
```

#### 2. Kiểm tra JWT_SECRET trong .env
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### 3. Kiểm tra Authorization Header
```javascript
// Đảm bảo gửi đúng format
Authorization: Bearer <your-jwt-token>
```

#### 4. Test với Postman/Swagger
1. Đăng nhập để lấy token: `POST /auth/login`
2. Copy token từ response
3. Sử dụng token trong Authorization header: `Bearer <token>`

#### 5. Kiểm tra Token Expiration
- Token mặc định có thời hạn 24h
- Nếu hết hạn, cần đăng nhập lại

#### 6. Debug Steps
1. Gọi `GET /auth/debug/jwt-info` để kiểm tra JWT config
2. Kiểm tra console logs để xem JWT payload
3. Verify token format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Endpoints cần Authentication:
- Tất cả endpoints có `@UseGuards(JwtAuthGuard)` 
- Trừ các endpoints có `@Public()`

### Endpoints Public (không cần auth):
- `POST /auth/login`
- `POST /auth/register` 
- `POST /auth/send-otp`
- `POST /auth/login-otp`
- `GET /auth/debug/jwt-info`
- Swagger UI: `/api-json`
- Upload files: `/uploads/*`

### Test Authentication:
```bash
# 1. Login để lấy token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 2. Sử dụng token để gọi protected endpoint
curl -X GET http://localhost:8000/auth/profile \
  -H "Authorization: Bearer <your-token>"
```
