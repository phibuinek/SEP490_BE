import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, Relationship } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Tên đăng nhập' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email người dùng' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6, description: 'Mật khẩu' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'Họ và tên người dùng' })
  @IsString()
  full_name: string;

  @ApiProperty({ example: '0901234567', description: 'Số điện thoại' })
  @IsString()
  phone: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF, description: 'Vai trò người dùng' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsString()
  avatar?: string;

  // Admin-specific
  @ApiPropertyOptional({ example: false, description: 'Là super admin?' })
  @IsOptional()
  @IsBoolean()
  is_super_admin?: boolean;

  // Staff-specific
  @ApiPropertyOptional({ example: 'Điều dưỡng', description: 'Chức vụ' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Cử nhân Điều dưỡng', description: 'Bằng cấp' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: '2023-01-15', description: 'Ngày vào làm' })
  @IsOptional()
  @IsDateString()
  join_date?: Date;

  // Family-specific
  @ApiPropertyOptional({ enum: Relationship, example: Relationship.SON, description: 'Mối quan hệ' })
  @IsOptional()
  @IsEnum(Relationship)
  relationship?: Relationship;

  @ApiPropertyOptional({ type: [String], example: ['60d...'], description: 'Danh sách ID người thân' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  residents?: string[];

  @ApiPropertyOptional({ example: '123 Main St, City, Country', description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Ghi chú về người dùng', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  notes?: string;
} 