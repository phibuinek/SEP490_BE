import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async findAll(department?: string, role?: string): Promise<User[]> {
    const filter: any = {};
    if (department) {
      filter.department = department;
    }
    if (role) {
      filter.roles = { $in: [role] };
    }
    return this.userModel.find(filter).select('-password').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    console.log('UsersService.findOne - input id:', id);
    console.log('UsersService.findOne - id type:', typeof id);
    console.log('UsersService.findOne - isValid ObjectId:', Types.ObjectId.isValid(id));
    
    const user = await this.userModel.findById(id).select('-password').exec();
    console.log('UsersService.findOne - found user:', user ? user.email : 'null');
    
    if (!user) {
      console.log('UsersService.findOne - User not found for ID:', id);
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
        roles: { $in: ['staff'] },
      })
      .select('-password')
      .exec();
  }

  // Sửa hàm updateRoles để nhận roles: string[]
  async updateRoles(id: string, roles: string[]) {
    // Nếu schema chỉ còn 1 role, chỉ lấy roles[0]
    await this.userModel.findByIdAndUpdate(id, { role: roles[0] });
    return { message: 'User role updated successfully.' };
  }

  async deactivateUser(user_id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(user_id, { is_active: false }, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async activateUser(user_id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(user_id, { is_active: true }, { new: true })
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
}
