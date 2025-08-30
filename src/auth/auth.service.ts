import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { MailService } from '../common/mail.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { OtpLoginDto } from './dto/otp-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Role } from '../common/enums/role.enum';
import { UserRole, UserStatus, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Tối ưu: Kiểm tra email format trước khi query database
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Email không hợp lệ' };
    }

    // Tối ưu: Lấy user với các field cần thiết
    const user = await this.usersService.findByEmail(email);
    
    // Kiểm tra email có tồn tại không
    if (!user) {
      return { success: false, message: 'Mật khẩu và email không chính xác!' };
    }
    
    // Kiểm tra trạng thái tài khoản
    if (user.status !== 'active') {
      return { success: false, message: 'Tài khoản đã bị khóa hoặc chưa được kích hoạt' };
    }
    
    // Tối ưu: So sánh password ngay lập tức
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: 'Mật khẩu không chính xác' };
    }
    
    const { password: _, ...result } = user.toObject();
    return { success: true, user: result };
  }

  async login(loginDto: LoginDto) {
    try {
      const validationResult = await this.validateUser(loginDto.email, loginDto.password);
      
      // Nếu validation thất bại
      if (!validationResult.success) {
        return {
          success: false,
          message: validationResult.message,
          error: 'INVALID_CREDENTIALS'
        };
      }
      
      const user = validationResult.user;
      const payload = {
        email: user.email,
        sub: user._id.toString(),
        role: user.role,
        username: user.username,
      };

      return {
        success: true,
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
      // Xử lý các lỗi khác
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.',
        error: 'LOGIN_ERROR'
      };
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const { email } = forgotPasswordDto;
      
      // Tìm user theo email
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        return {
          success: false,
          message: 'Email không tồn tại trong hệ thống',
          error: 'EMAIL_NOT_FOUND'
        };
      }

      // Kiểm tra trạng thái tài khoản
      if (user.status !== 'active') {
        return {
          success: false,
          message: 'Tài khoản đã bị khóa hoặc chưa được kích hoạt',
          error: 'ACCOUNT_INACTIVE'
        };
      }

      // Mật khẩu cố định theo yêu cầu
      const newPassword = '123456789';
      
      // Reset password trong database
      await this.usersService.resetPassword((user as any)._id.toString(), newPassword);
      
      // Gửi email thông báo
      const emailResult = await this.mailService.sendResetPasswordEmail({
        to: user.email,
        username: user.username,
        newPassword: newPassword
      });

      return {
        success: true,
        message: 'Mật khẩu đã được đặt lại và gửi về email của bạn',
        emailSent: !emailResult.error,
        userId: (user as any)._id.toString()
      };
      
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.',
        error: 'RESET_PASSWORD_ERROR'
      };
    }
  }

  // OTP Authentication Methods
  async sendOtp(phone: string) {
    return await this.otpService.sendOtp(phone);
  }

  async loginWithOtp(otpLoginDto: OtpLoginDto) {
    try {
      const { phone, otp } = otpLoginDto;
      
      // Xác thực OTP
      const verificationResult = await this.otpService.verifyOtp(phone, otp);
      
      if (!verificationResult.success) {
        return {
          success: false,
          message: verificationResult.message,
          error: 'INVALID_OTP'
        };
      }

      const user = verificationResult.user;
      
      // Tạo JWT token
      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
        username: user.username,
      };

      return {
        success: true,
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
        },
        message: 'Đăng nhập thành công',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.',
        error: 'OTP_LOGIN_ERROR'
      };
    }
  }
}
