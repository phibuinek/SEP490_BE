import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import type { Express } from 'express';

export class RegisterDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  confirmPassword: string;

  @ApiProperty({ 
    example: 'Nguyễn Văn A',
    description: 'Họ và tên đầy đủ'
  })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ 
    example: '0987654329',
    description: 'Số điện thoại'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,11}$/, { message: 'Phone number must be 10-11 digits' })
  phone: string;

  @ApiPropertyOptional({ 
    example: 'family_user',
    description: 'Tên đăng nhập (tùy chọn; nếu bỏ trống sẽ tự sinh)'
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ 
    example: '123 Đường ABC, Quận 1, TP.HCM',
    description: 'Địa chỉ (tùy chọn)'
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ 
    example: '123456789012',
    description: 'Mã số căn cước công dân (12 chữ số)'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{12}$/, { message: 'CCCD ID must be exactly 12 digits' })
  cccd_id: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Ảnh CCCD mặt trước (bắt buộc)'
  })
  cccd_front: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary', 
    description: 'Ảnh CCCD mặt sau (bắt buộc)'
  })
  cccd_back: Express.Multer.File;
}
