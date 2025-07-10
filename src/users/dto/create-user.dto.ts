import { IsEmail, IsString, IsOptional, IsArray, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ enum: Role, isArray: true, example: [Role.FAMILY_MEMBER] })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'con gái' })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiPropertyOptional({ type: [String], example: ['residentId1', 'residentId2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  residents?: string[];

  @ApiPropertyOptional({ example: 'Bác sĩ' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Thạc sĩ Y khoa' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: '2022-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  joinDate?: string;
} 