const fs = require('fs');

// Nội dung file .env với encoding UTF-8
const envContent = `MONGODB_URI=mongodb+srv://<username>:<password>@nursinghomemanagementsy.v48raye.mongodb.net/nhms_db?retryWrites=true&w=majority
PORT=8000
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development`;

// Ghi file với encoding UTF-8 rõ ràng
fs.writeFileSync('.env', envContent, 'utf8');

console.log('✅ File .env đã được tạo với encoding UTF-8');
console.log('📄 Nội dung file:');
console.log(envContent); 