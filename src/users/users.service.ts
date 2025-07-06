import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
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
    return this.userModel.find({
      department,
      roles: { $in: ['staff'] }
    }).select('-password').exec();
  }

  async updateRoles(userId: string, roles: Role[]): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { roles },
      { new: true }
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deactivateUser(userId: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password').exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async addResidentToFamily(familyId: string, residentId: any): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      familyId,
      { $push: { residents: residentId } },
      { new: true },
    ).exec();
  }

  async removeResidentFromFamily(familyId: string, residentId: any): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      familyId,
      { $pull: { residents: residentId } },
      { new: true },
    ).exec();
  }
} 