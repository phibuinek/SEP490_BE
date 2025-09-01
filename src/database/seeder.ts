import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class DatabaseSeeder {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Tắt seeder tự động vì dữ liệu Atlas đã có
  // async onModuleInit() {
  //   await this.seedUsers();
  // }

  // Method để seed manual nếu cần (gọi từ API endpoint hoặc script riêng)
  async seedUsers() {
    try {
      // Kiểm tra xem đã có users trong database chưa
      const existingUsersCount = await this.userModel.countDocuments();

      if (existingUsersCount > 0) {
        console.log(
          `✅ Database already has ${existingUsersCount} users. Seeding skipped to preserve Atlas data.`,
        );
        return;
      }

      console.log('�� Database is empty. Starting manual seeding process...');

      // Đọc dữ liệu từ users.json
      const usersJsonPath = path.join(process.cwd(), 'users.json');
      if (!fs.existsSync(usersJsonPath)) {
        console.log('⚠️  users.json not found, manual seeding skipped');
        return;
      }

      const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
      console.log(`📝 Found ${usersData.length} users in users.json`);

      // CHƯƠNG TRÌNH CHỈ SEED KHI DATABASE RỖNG - BẢO VỆ DỮ LIỆU ATLAS

      let successCount = 0;
      let errorCount = 0;

      for (const userData of usersData) {
        try {
          // Hash password nếu chưa hash
          if (
            !userData.password.startsWith('$2a$') &&
            !userData.password.startsWith('$2b$')
          ) {
            userData.password = await bcrypt.hash(userData.password, 10);
          }

          // Đảm bảo các trường date là kiểu Date
          userData.created_at = new Date(userData.created_at);
          userData.updated_at = new Date(userData.updated_at);
          if (userData.join_date) {
            userData.join_date = new Date(userData.join_date);
          }

          // Tạo user mới
          await this.userModel.create(userData);
          console.log(
            `✅ Seeded user: ${userData.email} (${userData.username})`,
          );
          successCount++;
        } catch (err) {
          console.error(
            `❌ Error seeding user ${userData.email || 'unknown'}:`,
            err.message,
          );
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
      console.error('Error in seeding process:', error);
    }
  }
}
