import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  Matches,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn A', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  full_name: string;

  @ApiProperty({ example: 'user@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0987654321', pattern: '^[0-9]{10,15}$' })
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phone: string;

  @ApiProperty({ example: 'username_123', pattern: '^[a-zA-Z0-9_]{3,30}$' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,30}$/)
  username: string;

  @ApiProperty({ example: 'hashedpassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example:
      'https://png.pngtree.com/element_our/20200610/ourmid/pngtree-character-default-avatar-image_2237203.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.FAMILY })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_super_admin?: boolean;

  @ApiPropertyOptional({ example: 'Bác sĩ' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Thạc sĩ Y khoa' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: '2022-06-01' })
  @IsOptional()
  @IsString()
  join_date?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Ghi chú về người dùng' })
  @IsOptional()
  @IsString()
  notes?: string;

  // CCCD Information for family members
  @ApiPropertyOptional({ 
    example: '123456789012',
    description: 'Mã số căn cước công dân (12 chữ số)'
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{12}$/, { message: 'CCCD ID must be exactly 12 digits' })
  cccd_id?: string;

  @ApiPropertyOptional({ 
    example: 'uploads/cccd_front_123456789.jpg',
    description: 'Đường dẫn ảnh CCCD mặt trước'
  })
  @IsOptional()
  @IsString()
  cccd_front?: string;

  @ApiPropertyOptional({ 
    example: 'uploads/cccd_back_123456789.jpg',
    description: 'Đường dẫn ảnh CCCD mặt sau'
  })
  @IsOptional()
  @IsString()
  cccd_back?: string;

  @ApiPropertyOptional({ example: '2024-01-10T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  created_at?: string;

  @ApiPropertyOptional({ example: '2024-01-10T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  updated_at?: string;
}
