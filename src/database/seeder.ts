import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedUsers();
  }

  private async seedUsers() {
    const adminExists = await this.userModel.findOne({ role: UserRole.ADMIN });
    if (adminExists) {
      console.log('Admin user already exists, skipping seeding...');
      return;
    }

    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        phone: '0000000000',
        password: await bcrypt.hash('admin123', 10),
        full_name: 'System Administrator',
        role: UserRole.ADMIN,
        is_super_admin: true,
      },
      {
        username: 'staff1',
        email: 'staff@example.com',
        phone: '0000000001',
        password: await bcrypt.hash('staff123', 10),
        full_name: 'Staff Member',
        role: UserRole.STAFF,
        position: 'Điều dưỡng',
      },
      {
        username: 'family1',
        email: 'family@example.com',
        phone: '0000000002',
        password: await bcrypt.hash('family123', 10),
        full_name: 'Family Member',
        role: UserRole.FAMILY,
        relationship: 'con trai',
      },
    ];

    try {
      await this.userModel.insertMany(users);
      console.log('Seeded default users successfully');
      console.log('Admin: admin@example.com / admin123');
      console.log('Staff: staff@example.com / staff123');
      console.log('Family: family@example.com / family123');
    } catch (error) {
      console.error('Error seeding users:', error);
    }
  }
} 