import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserStatus } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      console.log('[USER][CREATE] Input DTO:', JSON.stringify(createUserDto, null, 2));
      console.log('[USER][CREATE] Role from DTO:', createUserDto.role);
      console.log('[USER][CREATE] Role type:', typeof createUserDto.role);
      
      // Check if username already exists
      const existingUsername = await this.findByUsername(createUserDto.username);
      if (existingUsername) {
        console.log('[USER][CREATE] Username already exists:', createUserDto.username);
        throw new BadRequestException('Username already exists');
      }
      
      // Check if email already exists
      const existingEmail = await this.findByEmail(createUserDto.email);
      if (existingEmail) {
        console.log('[USER][CREATE] Email already exists:', createUserDto.email);
        throw new BadRequestException('Email already exists');
      }
      
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      console.log('[USER][CREATE] Password hashed successfully');
      
      // Set default values for optional fields
      const userData = {
        ...createUserDto,
        password: hashedPassword,
        status: createUserDto.status || UserStatus.ACTIVE, // Default to active
        role: createUserDto.role, // Ensure role is properly set
      };
      
      console.log('[USER][CREATE] User data to save:', JSON.stringify(userData, null, 2));
      
      const createdUser = new this.userModel(userData);
      
      console.log('[USER][CREATE] User model created, saving...');
      const savedUser = await createdUser.save();
      
      console.log('[USER][CREATE] Successfully created user:', savedUser._id);
      return savedUser;
    } catch (error) {
      console.error('[USER][CREATE][ERROR]', error);
      console.error('[USER][CREATE][ERROR] Stack:', error.stack);
      throw error;
    }
  }

  async findAll(department?: string, role?: string): Promise<User[]> {
    const filter: any = {};
    if (department) {
      filter.department = department;
    }
    if (role) {
      filter.role = role; // Sử dụng 'role' thay vì 'roles'
    }
    return this.userModel.find(filter).select('-password').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid user id');
    const user = await this.userModel.findById(new Types.ObjectId(id)).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneWithPassword(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid user id');
    const user = await this.userModel.findById(new Types.ObjectId(id)).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByDepartment(department: string): Promise<User[]> {
    return this.userModel
      .find({
        department,
        role: 'staff', // Sử dụng 'role' thay vì 'roles'
      })
      .select('-password')
      .exec();
  }

  async findByRoles(roles: string[]): Promise<User[]> {
    return this.userModel
      .find({
        role: { $in: roles }, // Sử dụng $in để tìm users có role trong danh sách
      })
      .select('-password')
      .exec();
  }

  async getUserStatsByRole() {
    const stats = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          role: '$_id',
          total: '$count',
          active: '$active',
          inactive: '$inactive',
          _id: 0
        }
      },
      {
        $sort: { role: 1 }
      }
    ]);

    return {
      total_users: await this.userModel.countDocuments(),
      by_role: stats
    };
  }

  // XÓA TOÀN BỘ HÀM updateRoles

  async deactivateUser(user_id: string): Promise<User> {
    if (!Types.ObjectId.isValid(user_id)) throw new BadRequestException('Invalid user id');
    const user = await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(user_id), { status: 'inactive', updated_at: new Date() }, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async activateUser(user_id: string): Promise<User> {
    if (!Types.ObjectId.isValid(user_id)) throw new BadRequestException('Invalid user id');
    const user = await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(user_id), { status: 'active', updated_at: new Date() }, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async addResidentToFamily(
    family_id: string,
    resident_id: any,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        family_id,
        { $push: { residents: resident_id } },
        { new: true },
      )
      .exec();
  }

  async removeResidentFromFamily(
    family_id: string,
    resident_id: any,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(
        family_id,
        { $pull: { residents: resident_id } },
        { new: true },
      )
      .exec();
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid userId');
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Old password is incorrect');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Password changed successfully' };
  }

  async resetPassword(userId: string, newPassword: string) {
    if (!Types.ObjectId.isValid(userId)) throw new BadRequestException('Invalid userId');
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Password reset successfully' };
  }

  async updateUserById(id: string, updateUserDto: Partial<User>): Promise<User> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid user id');
    // Nếu có trường role, ép kiểu về UserRole
    if (updateUserDto.role && typeof updateUserDto.role === 'string') {
      updateUserDto.role = updateUserDto.role as any; // ép kiểu để tránh lỗi linter
    }
    const user = await this.userModel.findByIdAndUpdate(new Types.ObjectId(id), updateUserDto, { new: true }).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getPasswordById(id: string): Promise<string | undefined> {
    if (!Types.ObjectId.isValid(id)) return undefined;
    const user = await this.userModel.findById(new Types.ObjectId(id)).exec();
    return user?.password;
  }

  async deleteUser(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid user id');
    
    const user = await this.userModel.findByIdAndDelete(new Types.ObjectId(id)).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }
}
