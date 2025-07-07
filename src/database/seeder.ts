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
    const adminExists = await this.userModel.findOne({ roles: Role.ADMIN });
    if (adminExists) {
      console.log('Admin user already exists, skipping seeding...');
      return;
    }

    const now = new Date();
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        full_name: 'System Administrator',
        role: 'admin',
        isActive: true,
        phone: '0123456789',
        address: 'Hà Nội',
        department: 'quan_ly',
        created_at: now,
        updated_at: now,
      },
      {
        username: 'staff1',
        email: 'staff@example.com',
        password: await bcrypt.hash('staff123', 10),
        full_name: 'Staff Member',
        role: 'staff',
        isActive: true,
        phone: '0987654321',
        address: 'Hồ Chí Minh',
        department: 'y_te',
        created_at: now,
        updated_at: now,
      },
      {
        username: 'family1',
        email: 'family@example.com',
        password: await bcrypt.hash('family123', 10),
        full_name: 'Family Member',
        role: 'family_member',
        isActive: true,
        phone: '0111222333',
        address: 'Đà Nẵng',
        department: 'hoat_dong',
        created_at: now,
        updated_at: now,
      },
    ];

    try {
      await this.userModel.insertMany(users);
      console.log('Seeded default users successfully');
      console.log('Admin: admin@example.com / admin123');
      console.log('Staff: staff@example.com / staff123');
      console.log('Family: family@example.com / family123');
    } catch (error) {
      console.error('Error seeding users:', JSON.stringify(error, null, 2));
    }
  }
} 