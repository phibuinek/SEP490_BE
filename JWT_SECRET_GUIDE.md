# 🔐 Hướng dẫn tạo JWT_SECRET mạnh

## 📋 Tổng quan
JWT_SECRET là một chuỗi bí mật được sử dụng để ký và xác thực JWT tokens. Độ mạnh của JWT_SECRET rất quan trọng cho bảo mật ứng dụng.

## 🎯 Tiêu chuẩn JWT_SECRET mạnh

### ✅ Yêu cầu tối thiểu:
- **Độ dài:** Ít nhất 64 ký tự
- **Entropy:** Cao (nhiều ký tự khác nhau)
- **Random:** Được tạo ngẫu nhiên, không dự đoán được

### ❌ Tránh:
- Chuỗi đơn giản: `"secret"`, `"password"`, `"123456"`
- Thông tin cá nhân: tên, ngày sinh, email
- Chuỗi có thể đoán được

## 🛠️ Cách tạo JWT_SECRET

### Phương pháp 1: Node.js crypto (Khuyến nghị)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Phương pháp 2: Sử dụng script có sẵn
```bash
node generate-jwt-secret.js
```

### Phương pháp 3: Online generators (Chỉ cho test)
- https://generate-secret.vercel.app/64
- https://www.allkeysgenerator.com/

## 🔍 Kiểm tra JWT_SECRET

### Sử dụng script validation:
```bash
node validate-jwt-secret.js "your-jwt-secret-here"
```

### Kiểm tra thủ công:
1. **Độ dài:** Ít nhất 64 ký tự
2. **Đa dạng:** Chứa chữ cái, số, ký tự đặc biệt
3. **Random:** Không có pattern dễ đoán

## 📝 JWT_SECRET mẫu đã tạo

### Option 1 (Khuyến nghị):
```
8b7178c0beb21d073958f1230efb8167a575429cb549f59cb4e72320a7baae38e5ae1d9a93e7cf06c37867316ef8fa681292129d7af9d9171498d898453991f7
```

### Option 2:
```
d3293323e1af74ed80ea2f06fe8a6906583b50772c8db491700c5accf5bc4fe49f369e08e140c3e284f9b762285a2e7b86a27f9d7481c365fd765ca2a11fcc54
```

### Option 3:
```
7cecf8d1431072039836fe58cc5fbcc0141ff8494789c9740c912e68ab6c209c4969b54099716af4d0582aad180b63f6d4236d6d21f1b087f9385105c9b87861
```

## ⚙️ Cấu hình trên Render

### Bước 1: Truy cập Environment Variables
1. Đăng nhập Render Dashboard
2. Chọn Web Service `nhms-backend`
3. Vào tab **"Environment"**

### Bước 2: Thêm JWT_SECRET
1. Click **"Add Environment Variable"**
2. **Key:** `JWT_SECRET`
3. **Value:** Copy một trong các JWT_SECRET mẫu trên
4. Click **"Save Changes"**

### Bước 3: Redeploy
- Render sẽ tự động redeploy với JWT_SECRET mới

## 🔒 Bảo mật JWT_SECRET

### ✅ Best Practices:
- **Không commit** JWT_SECRET vào git
- **Không chia sẻ** JWT_SECRET với ai
- **Thay đổi định kỳ** JWT_SECRET (3-6 tháng)
- **Backup** JWT_SECRET an toàn

### ❌ Tránh:
- Hardcode trong code
- Commit vào repository
- Chia sẻ qua email/chat
- Sử dụng JWT_SECRET mặc định

## 🚨 Lưu ý quan trọng

### Khi thay đổi JWT_SECRET:
1. **Tất cả tokens hiện tại sẽ bị vô hiệu hóa**
2. **Users sẽ phải đăng nhập lại**
3. **Cần thông báo cho users**

### Backup JWT_SECRET:
- Lưu trong password manager
- Encrypt file backup
- Chia sẻ an toàn với team

## 📞 Hỗ trợ

Nếu gặp vấn đề với JWT_SECRET:
1. Kiểm tra logs trên Render
2. Verify JWT_SECRET format
3. Test authentication endpoints
4. Contact development team
