import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Put,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { extname } from 'path';
import { Express } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OtpLoginDto, SendOtpDto } from './dto/otp-login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @ApiResponse({
    status: 200,
    description: 'Login failed - Invalid credentials.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cccd_front', maxCount: 1 },
      { name: 'cccd_back', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            // 🚀 OPTIMIZATION: Faster directory creation
            const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
            const baseDir = isProd ? path.join('/tmp') : process.cwd();
            const uploadPath = path.join(baseDir, 'uploads');
            
            // Use existsSync check only if directory doesn't exist
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          } catch (err) {
            cb(err as any, '');
          }
        },
        filename: (req, file, cb) => {
          // 🚀 OPTIMIZATION: Faster filename generation
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        // 🚀 OPTIMIZATION: Faster MIME type check
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: { 
        fileSize: 10 * 1024 * 1024, // 🚀 OPTIMIZATION: Increased to 10MB for better quality
        files: 2 // Maximum 2 files
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Đăng ký tài khoản role FAMILY với CCCD bắt buộc' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiBody({
    description: 'Đăng ký tài khoản family với thông tin CCCD bắt buộc',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@gmail.com' },
        password: { type: 'string', minLength: 6, example: 'password123' },
        confirmPassword: { type: 'string', minLength: 6, example: 'password123' },
        full_name: { type: 'string', example: 'Nguyễn Văn A' },
        phone: { type: 'string', pattern: '^[0-9]{10,11}$', example: '0987654329' },
        username: { type: 'string', example: 'family_user' },
        address: { type: 'string', example: '123 Đường ABC, Quận 1, TP.HCM' },
        cccd_id: { type: 'string', pattern: '^[0-9]{12}$', example: '123456789012' },
        cccd_front: { type: 'string', format: 'binary', description: 'Ảnh CCCD mặt trước (bắt buộc)' },
        cccd_back: { type: 'string', format: 'binary', description: 'Ảnh CCCD mặt sau (bắt buộc)' },
      },
      required: [
        'email',
        'password', 
        'confirmPassword',
        'full_name',
        'phone',
        'cccd_id',
        'cccd_front',
        'cccd_back'
      ],
    },
  })
  async register(
    @UploadedFiles() files: {
      cccd_front?: Express.Multer.File[];
      cccd_back?: Express.Multer.File[];
    },
    @Body() dto: RegisterDto,
  ) {
    // Map uploaded files to DTO fields
    if (files?.cccd_front?.[0]) {
      dto.cccd_front = files.cccd_front[0];
    }
    if (files?.cccd_back?.[0]) {
      dto.cccd_back = files.cccd_back[0];
    }

    return this.authService.register(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully.' })
  async logout(@Request() req) {
    return this.authService.logout(req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user, updateProfileDto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'User self change password (must provide oldPassword & newPassword)',
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user, changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Forgot password - Reset password and send to email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully and email sent.',
  })
  @ApiResponse({
    status: 400,
    description: 'Email not found or account inactive.',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  // OTP Authentication Endpoints
  @Public()
  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number or user not found.',
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto.phone);
  }

  @Public()
  @Post('login-otp')
  @ApiOperation({ summary: 'Login with phone number and OTP' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or phone number.' })
  async loginWithOtp(@Body() otpLoginDto: OtpLoginDto) {
    return this.authService.loginWithOtp(otpLoginDto);
  }

  @Get('debug/jwt-info')
  @Public()
  @ApiOperation({ summary: 'Debug JWT configuration' })
  @ApiResponse({ status: 200, description: 'JWT debug information' })
  async getJwtDebugInfo() {
    return {
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      message: 'JWT debug information - check if JWT_SECRET is properly configured'
    };
  }
}
