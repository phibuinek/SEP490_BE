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
    console.log('Seeding or updating default users...');
    
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'System Administrator',
        roles: [Role.ADMIN],
        isActive: true,
      },
      {
        username: 'staff1',
        email: 'staff@example.com',
        password: await bcrypt.hash('staff123', 10),
        fullName: 'Staff Member',
        roles: [Role.STAFF],
        isActive: true,
      },
      {
        username: 'family1',
        email: 'family@example.com',
        password: await bcrypt.hash('family123', 10),
        fullName: 'Family Member',
        roles: [Role.FAMILY_MEMBER],
        isActive: true,
      },
    ];

    try {
      for (const user of users) {
        await this.userModel.updateOne(
          { email: user.email },
          { $set: user },
          { upsert: true } // Creates the user if it doesn't exist
        );
      }
      console.log('Seeded default users successfully');
      console.log('Admin: admin@example.com / admin123');
      console.log('Staff: staff@example.com / staff123');
      console.log('Family: family@example.com / family123');
    } catch (error) {
      console.error('Error seeding users:', error);
    }
  }
} 