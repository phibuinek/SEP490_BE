import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const now = new Date();
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        full_name: 'System Administrator',
        role: 'admin',
        status: 'active',
        phone: '0123456789',
        address: 'Hà Nội',
        created_at: now,
        updated_at: now,
      },
      {
        username: 'staff1',
        email: 'staff@example.com',
        password: await bcrypt.hash('staff123', 10),
        full_name: 'Staff Member',
        role: 'staff',
        status: 'active',
        phone: '0987654321',
        address: 'Hồ Chí Minh',
        created_at: now,
        updated_at: now,
      },
      {
        username: 'family1',
        email: 'family@example.com',
        password: await bcrypt.hash('family123', 10),
        full_name: 'Family Member',
        role: 'family',
        status: 'active',
        phone: '0111222333',
        address: 'Đà Nẵng',
        created_at: now,
        updated_at: now,
      },
    ];

    try {
      for (const user of users) {
        // Kiểm tra xem user đã tồn tại chưa
        const existingUser = await this.userModel.findOne({ 
          $or: [{ email: user.email }, { username: user.username }] 
        });
        
        if (!existingUser) {
          await this.userModel.create(user);
          console.log(`Created user: ${user.email}`);
        } else {
          console.log(`User already exists: ${user.email}`);
        }
      }
      
      console.log('Seeding completed successfully');
      console.log('Admin: admin@example.com / admin123');
      console.log('Staff: staff@example.com / staff123');
      console.log('Family: family@example.com / family123');
    } catch (error) {
      console.error('Error seeding users:', JSON.stringify(error, null, 2));
    }
  }
}
