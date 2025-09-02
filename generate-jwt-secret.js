const crypto = require('crypto');

// Tạo JWT_SECRET mạnh
function generateJWTSecret() {
  // Tạo 64 bytes random và convert sang hex
  const secret = crypto.randomBytes(64).toString('hex');
  
  console.log('🔐 JWT_SECRET được tạo:');
  console.log('='.repeat(80));
  console.log(secret);
  console.log('='.repeat(80));
  console.log('');
  console.log('📋 Copy và paste vào Environment Variables trên Render:');
  console.log(`JWT_SECRET=${secret}`);
  console.log('');
  console.log('✅ JWT_SECRET này có:');
  console.log(`   - Độ dài: ${secret.length} ký tự`);
  console.log(`   - Entropy cao: ${crypto.randomBytes(64).length * 8} bits`);
  console.log('   - An toàn cho production');
  
  return secret;
}

// Tạo nhiều options
console.log('🎲 Tạo 3 JWT_SECRET khác nhau để bạn chọn:\n');

for (let i = 1; i <= 3; i++) {
  console.log(`Option ${i}:`);
  generateJWTSecret();
  console.log('');
}

