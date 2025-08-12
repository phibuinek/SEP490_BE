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
    // Tối ưu: Kiểm tra email format trước khi query database
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new UnauthorizedException('Email không hợp lệ');
    }

    // Tối ưu: Lấy user với các field cần thiết
    const user = await this.usersService.findByEmail(email);
    
    // Kiểm tra email có tồn tại không
    if (!user) {
      throw new UnauthorizedException('Mật khẩu và email không chính xác!');
    }
    
    // Kiểm tra trạng thái tài khoản
    if (user.status !== 'active') {
      throw new UnauthorizedException('Tài khoản đã bị khóa hoặc chưa được kích hoạt');
    }
    
    // Tối ưu: So sánh password ngay lập tức
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }
    
    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
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
    } catch (error) {
      // Re-throw UnauthorizedException với thông báo chi tiết
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Xử lý các lỗi khác
      throw new UnauthorizedException('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.');
    }
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
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
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
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    // Cập nhật các field được phép
    Object.assign(userProfile, updateProfileDto);
    await userProfile.save();
    
    const profileData = userProfile.toObject();
    const { password, ...profile } = profileData;
    return {
      ...profile,
      id: profile._id.toString(),
      message: 'Cập nhật thông tin cá nhân thành công',
    };
  }

  async changePassword(user: any, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
    }

    // Sử dụng method có sẵn từ UsersService
    return await this.usersService.changePassword(
      user.userId,
      currentPassword,
      newPassword
    );
  }
}
