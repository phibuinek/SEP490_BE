import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsDateString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Nguyễn Văn A',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: 'user@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0987654321', pattern: '^[0-9]{10,15}$' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example:
      'https://png.pngtree.com/element_our/20200610/ourmid/pngtree-character-default-avatar-image_2237203.jpg',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiPropertyOptional({ example: 'Bác sĩ' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Thạc sĩ Y khoa' })
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Ghi chú về người dùng' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Join date in YYYY-MM-DD format (optional)',
  })
  @IsOptional()
  @IsDateString()
  join_date?: string;
}
