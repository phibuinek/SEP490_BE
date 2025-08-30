import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private usersService: UsersService,
  ) {}

  // Tạo mã OTP ngẫu nhiên 6 chữ số
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Gửi OTP (trong thực tế sẽ tích hợp với SMS service)
  private async sendOtpViaSms(phone: string, otp: string): Promise<boolean> {
    // === DEVELOPMENT MODE (TẠM THỜI TẮT AWS SNS) ===
    console.log(`[DEVELOPMENT] Sending OTP ${otp} to phone ${phone}`);
    console.log(`[DEVELOPMENT] In production, this would send an SMS via AWS SNS or Twilio`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
    
    // === TÍCH HỢP AWS SNS SMS (TẠM THỜI COMMENT) ===
    /*
    // Kiểm tra xem có cấu hình AWS SNS không
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
      try {
        const AWS = require('aws-sdk');
        
        // Cấu hình AWS
        AWS.config.update({
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        
        const sns = new AWS.SNS();
        
        // Format số điện thoại cho AWS SNS (thêm +84 cho Việt Nam nếu cần)
        let formattedPhone = phone;
        if (phone.startsWith('0')) {
          formattedPhone = '+84' + phone.substring(1);
        } else if (!phone.startsWith('+')) {
          formattedPhone = '+' + phone;
        }
        
        console.log(`[AWS SNS] Sending SMS to ${formattedPhone}`);
        
        const params = {
          Message: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
          PhoneNumber: formattedPhone
        };
        
        const result = await sns.publish(params).promise();
        
        console.log(`[AWS SNS] SMS sent successfully to ${formattedPhone}`);
        console.log(`[AWS SNS] Message ID: ${result.MessageId}`);
        return true;
      } catch (error) {
        console.error('[AWS SNS] SMS error:', error);
        
        // Log chi tiết lỗi để debug
        if (error.code) {
          console.error('[AWS SNS] Error code:', error.code);
          console.error('[AWS SNS] Error message:', error.message);
        }
        
        return false;
      }
    }
    
    // === TÍCH HỢP TWILIO SMS (FALLBACK) ===
    
    // Kiểm tra xem có cấu hình Twilio không
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      try {
        const twilio = require('twilio');
        const client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        // Format số điện thoại cho Twilio (thêm +84 cho Việt Nam nếu cần)
        let formattedPhone = phone;
        if (phone.startsWith('0')) {
          formattedPhone = '+84' + phone.substring(1);
        } else if (!phone.startsWith('+')) {
          formattedPhone = '+' + phone;
        }
        
        console.log(`[TWILIO] Sending SMS to ${formattedPhone}`);
        
        await client.messages.create({
          body: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
          from: process.env.TWILIO_FROM_NUMBER,
          to: formattedPhone
        });
        
        console.log(`[TWILIO] SMS sent successfully to ${formattedPhone}`);
        return true;
      } catch (error) {
        console.error('[TWILIO] SMS error:', error);
        
        // Log chi tiết lỗi để debug
        if (error.code) {
          console.error('[TWILIO] Error code:', error.code);
          console.error('[TWILIO] Error message:', error.message);
        }
        
        return false;
      }
    }
    
    // === FALLBACK: DEVELOPMENT MODE ===
    console.log(`[DEVELOPMENT] Sending OTP ${otp} to phone ${phone}`);
    console.log(`[DEVELOPMENT] In production, this would send an SMS via AWS SNS or Twilio`);
    
    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
    */
  }

  // Tạo và gửi OTP
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      // Kiểm tra xem có user nào với số điện thoại này không
      const user = await this.usersService.findByPhone(phone);
      if (!user) {
        throw new NotFoundException('Số điện thoại chưa được đăng ký trong hệ thống');
      }

      // Kiểm tra trạng thái tài khoản
      if (user.status !== 'active') {
        throw new BadRequestException('Tài khoản đã bị khóa hoặc chưa được kích hoạt');
      }

      // Xóa OTP cũ nếu có
      await this.otpModel.deleteMany({ phone });

      // Tạo OTP mới
      const otp = this.generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

      // Lưu OTP vào database
      const otpRecord = new this.otpModel({
        phone,
        otp,
        expiresAt,
      });
      await otpRecord.save();

      // Gửi OTP qua SMS
      const sent = await this.sendOtpViaSms(phone, otp);

      if (sent) {
        return {
          success: true,
          message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
        };
      } else {
        throw new BadRequestException('Không thể gửi mã OTP. Vui lòng thử lại sau.');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.');
    }
  }

  // Xác thực OTP
  async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Tìm OTP record
      const otpRecord = await this.otpModel.findOne({
        phone,
        otp,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otpRecord) {
        // Tăng số lần thử
        await this.otpModel.updateOne(
          { phone },
          { $inc: { attemptCount: 1 } }
        );

        throw new BadRequestException('Mã OTP không đúng hoặc đã hết hạn');
      }

      // Kiểm tra số lần thử
      if (otpRecord.attemptCount >= 3) {
        throw new BadRequestException('Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng yêu cầu mã mới.');
      }

      // Đánh dấu OTP đã sử dụng
      await this.otpModel.updateOne(
        { _id: otpRecord._id },
        { isUsed: true }
      );

      // Lấy thông tin user
      const user = await this.usersService.findByPhone(phone);
      if (!user) {
        throw new NotFoundException('Không tìm thấy thông tin người dùng');
      }

      return {
        success: true,
        message: 'Xác thực OTP thành công',
        user: {
          id: (user as any)._id.toString(),
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại sau.');
    }
  }

  // Xóa OTP cũ
  async cleanupExpiredOtps(): Promise<void> {
    await this.otpModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }
}
