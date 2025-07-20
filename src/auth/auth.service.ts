import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '../common/enums/role.enum';
import { UserRole, UserStatus, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.status === 'active' &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  // Loại bỏ register vì người nhà không tự đăng ký
  // Chỉ admin tạo tài khoản sau khi đăng ký dịch vụ

  async logout(user: any) {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    return {
      message: 'Logged out successfully',
      success: true,
    };
  }

  async getProfile(user: any) {
    console.log('getProfile - user object:', user);
    console.log('getProfile - user.userId:', user.userId);
    console.log('getProfile - user.sub:', user.sub);
    console.log('getProfile - user.email:', user.email);
    
    // Thử cả hai cách để đảm bảo
    const userId = user.userId || user.sub;
    console.log('getProfile - final userId:', userId);
    
    const userProfile = await this.usersService.findOne(userId);
    if (!userProfile) {
      console.log('getProfile - User not found with ID:', userId);
      throw new NotFoundException('User not found');
    }

    console.log('getProfile - User found:', userProfile.email);
    
    // Convert to plain object and add id field
    const profileData = userProfile.toObject();
    return {
      ...profileData,
      id: profileData._id.toString(),
    };
  }

  async updateProfile(user: any, updateProfileDto: UpdateProfileDto) {
    // Sử dụng findOne và save thay vì update method
    const userProfile = await this.usersService.findOne(user.userId);
    if (!userProfile) {
      throw new NotFoundException('User not found');
    }

    // Cập nhật các field được phép
    Object.assign(userProfile, updateProfileDto);
    await userProfile.save();
    
    const profileData = userProfile.toObject();
    const { password, ...profile } = profileData;
    return {
      ...profile,
      id: profile._id.toString(),
      message: 'Profile updated successfully',
    };
  }

  async changePassword(user: any, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Sử dụng method có sẵn từ UsersService
    return await this.usersService.changePassword(
      user.userId,
      currentPassword,
      newPassword
    );
  }
}
