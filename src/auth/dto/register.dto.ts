import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@email.com' })
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

  @ApiProperty({ 
    example: 'family_user',
    description: 'Tên đăng nhập'
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({ 
    example: '123 Đường ABC, Quận 1, TP.HCM',
    description: 'Địa chỉ (tùy chọn)'
  })
  @IsString()
  @IsOptional()
  address?: string;
}
