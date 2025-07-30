# Ngrok Setup cho PayOS Webhook

## Tại sao cần ngrok?

PayOS webhook cần gọi đến một **public URL** để thông báo kết quả thanh toán. Nhưng backend đang chạy trên localhost, nên cần ngrok để tạo public tunnel.

## Cài đặt ngrok:

1. **Tải ngrok:** https://ngrok.com/download
2. **Đăng ký tài khoản:** https://dashboard.ngrok.com/signup
3. **Lấy authtoken:** Vào https://dashboard.ngrok.com/get-started/your-authtoken

## Chạy ngrok:

```bash
# Cài đặt authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Tạo tunnel cho backend (port 8000)
ngrok http 8000
```

## Cấu hình PayOS Webhook:

1. **Đăng nhập PayOS Dashboard**
2. **Vào Webhook Settings**
3. **Thêm webhook URL:** `https://your-ngrok-url.ngrok.io/payment/webhook`
4. **Chọn events:** Payment Success, Payment Failed, Payment Cancelled

## Ví dụ ngrok URL:
```
https://abc123.ngrok.io/payment/webhook
```

## Lưu ý:
- Ngrok URL thay đổi mỗi lần restart (trừ khi dùng ngrok pro)
- Cần cập nhật webhook URL trên PayOS mỗi khi URL thay đổi
- Chỉ dùng cho development, production cần domain thật

## Test webhook:
```bash
# Test webhook endpoint
curl -X POST https://your-ngrok-url.ngrok.io/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```