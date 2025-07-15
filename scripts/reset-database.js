const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nhms_db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Đếm users hiện có
    const existingCount = await usersCollection.countDocuments();
    console.log(`📊 Current users in database: ${existingCount}`);

    // Xác nhận từ user trước khi xóa
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question(`⚠️  This will DELETE ALL ${existingCount} users. Continue? (yes/no): `, resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      return;
    }

    // Xóa tất cả users
    const deleteResult = await usersCollection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} users`);

    // Đọc và seed dữ liệu mới
    const usersJsonPath = path.join(process.cwd(), 'users.json');
    if (!fs.existsSync(usersJsonPath)) {
      console.log('⚠️  users.json not found');
      return;
    }

    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    console.log(`📝 Found ${usersData.length} users in users.json`);

    // Hash passwords và seed
    for (const userData of usersData) {
      if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      userData.created_at = new Date(userData.created_at);
      userData.updated_at = new Date(userData.updated_at);
      if (userData.join_date) {
        userData.join_date = new Date(userData.join_date);
      }
    }

    const insertResult = await usersCollection.insertMany(usersData);
    console.log(`✅ Successfully seeded ${insertResult.insertedCount} users`);

    console.log('\n🔐 Login credentials:');
    console.log('Admin: admin@gmail.com / admin123');
    console.log('Staff: staff@gmail.com / staff123');
    console.log('Family: bao@gmail.com / family123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔚 Database connection closed');
  }
}

// Chạy script
resetDatabase(); 