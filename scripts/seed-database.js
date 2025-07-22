const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://baotranlechi05:Gdebju5xwSxFII2I@nursinghomemanagementsy.v48raye.mongodb.net/nhms_db?retryWrites=true&w=majority&appName=NursingHomeManagementSystem';

// User Schema
const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true, minlength: 1, maxlength: 100 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ 
  },
  phone: { type: String, required: true, match: /^[0-9]{10,15}$/ },
  username: { type: String, required: true, unique: true, match: /^[a-zA-Z0-9_]{3,30}$/ },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: null },
  role: { 
    type: String, 
    required: true, 
    enum: ['admin', 'staff', 'family'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['active', 'inactive', 'suspended', 'deleted'] 
  },
  is_super_admin: { type: Boolean, default: false },
  position: String,
  qualification: String,
  join_date: Date,
  address: String,
  notes: String,
  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users'
});

const User = mongoose.model('User', userSchema);

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Check if users already exist
    const existingUsersCount = await User.countDocuments();
    console.log(`📊 Found ${existingUsersCount} existing users in database`);

    // Read users.json
    const usersJsonPath = path.join(process.cwd(), 'users.json');
    if (!fs.existsSync(usersJsonPath)) {
      console.log('❌ users.json not found!');
      return;
    }

    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    console.log(`📝 Found ${usersData.length} users in users.json`);

    let successCount = 0;
    let errorCount = 0;

    for (const userData of usersData) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [{ email: userData.email }, { username: userData.username }] 
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password if not already hashed
        if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
          userData.password = await bcrypt.hash(userData.password, 10);
        }

        // Ensure date fields are Date objects
        userData.created_at = new Date(userData.created_at);
        userData.updated_at = new Date(userData.updated_at);
        if (userData.join_date) {
          userData.join_date = new Date(userData.join_date);
        }

        // Create user
        await User.create(userData);
        console.log(`✅ Created user: ${userData.email} (${userData.username})`);
        successCount++;

      } catch (err) {
        console.error(`❌ Error creating user ${userData.email || 'unknown'}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Seeding completed!');
    console.log(`✅ Success: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);

    if (successCount > 0) {
      console.log('\n🔐 Login credentials:');
      console.log('Admin: admin@gmail.com / admin123');
      console.log('Staff: staff@gmail.com / staff123');
      console.log('Family: bao@gmail.com / family123');
    }

  } catch (error) {
    console.error('❌ Error in seeding process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeder
seedDatabase(); 