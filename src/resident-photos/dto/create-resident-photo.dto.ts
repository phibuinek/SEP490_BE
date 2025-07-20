import { IsString, IsOptional, IsArray, IsMongoId, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResidentPhotoDto {
  @ApiProperty({ 
    example: '664f1b2c2f8b2c0012a4e750',
    description: 'ID của người cao tuổi (MongoDB ObjectId)'
  })
  @IsMongoId()
  resident_id: string;

  @ApiPropertyOptional({ 
    example: 'Ảnh chụp hoạt động thể dục buổi sáng',
    description: 'Mô tả về ảnh'
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ 
    example: 'thể dục',
    description: 'Loại hoạt động trong ảnh'
  })
  @IsOptional()
  @IsString()
  activity_type?: string;

  @ApiPropertyOptional({ 
    type: [String],
    example: ['thể dục', 'buổi sáng', 'năng động'],
    description: 'Các tag cho ảnh (có thể là string hoặc array)'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Nếu là string, split theo dấu phẩy hoặc chuyển thành array
      return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    return [value];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    example: '2024-01-15T08:00:00.000Z',
    description: 'Ngày chụp ảnh (ISO 8601 format)'
  })
  @IsOptional()
  @IsDateString()
  taken_date?: string;

  @ApiPropertyOptional({ 
    example: 'Resident tham gia tích cực hoạt động thể dục',
    description: 'Ghi chú của nhân viên'
  })
  @IsOptional()
  @IsString()
  staff_notes?: string;

  @ApiPropertyOptional({ 
    example: '664f1b2c2f8b2c0012a4e751',
    description: 'ID của hoạt động liên quan (nếu có)'
  })
  @IsOptional()
  @IsMongoId()
  related_activity_id?: string;
}
