const crypto = require('crypto');

// Validate JWT_SECRET
function validateJWTSecret(secret) {
  console.log('🔍 Kiểm tra JWT_SECRET...');
  console.log('='.repeat(50));
  
  // Kiểm tra độ dài
  const length = secret.length;
  console.log(`📏 Độ dài: ${length} ký tự`);
  
  // Kiểm tra entropy
  const entropy = calculateEntropy(secret);
  console.log(`🎲 Entropy: ${entropy.toFixed(2)} bits`);
  
  // Đánh giá độ mạnh
  let strength = 'Weak';
  let recommendation = '';
  
  if (length >= 64 && entropy >= 4.0) {
    strength = 'Strong';
    recommendation = '✅ Tuyệt vời! JWT_SECRET này an toàn cho production.';
  } else if (length >= 32 && entropy >= 3.5) {
    strength = 'Medium';
    recommendation = '⚠️  Khá tốt, nhưng nên tạo JWT_SECRET mạnh hơn.';
  } else {
    strength = 'Weak';
    recommendation = '❌ Không an toàn! Hãy tạo JWT_SECRET mạnh hơn.';
  }
  
  console.log(`💪 Độ mạnh: ${strength}`);
  console.log(`💡 Khuyến nghị: ${recommendation}`);
  
  // Kiểm tra các ký tự đặc biệt
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);
  const hasNumbers = /\d/.test(secret);
  const hasLetters = /[a-zA-Z]/.test(secret);
  
  console.log(`🔤 Chứa chữ cái: ${hasLetters ? '✅' : '❌'}`);
  console.log(`🔢 Chứa số: ${hasNumbers ? '✅' : '❌'}`);
  console.log(`🔣 Chứa ký tự đặc biệt: ${hasSpecialChars ? '✅' : '❌'}`);
  
  return strength === 'Strong';
}

// Tính entropy
function calculateEntropy(str) {
  const charCount = {};
  for (let char of str) {
    charCount[char] = (charCount[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  
  for (let count of Object.values(charCount)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

// Test với JWT_SECRET mẫu
const testSecret = process.argv[2] || 'your-secret-key';

console.log('🔐 JWT_SECRET Test Tool');
console.log('='.repeat(50));
console.log(`Secret: ${testSecret.substring(0, 20)}...`);
console.log('');

validateJWTSecret(testSecret);

console.log('');
console.log('📋 Hướng dẫn sử dụng:');
console.log('node validate-jwt-secret.js "your-jwt-secret-here"');
