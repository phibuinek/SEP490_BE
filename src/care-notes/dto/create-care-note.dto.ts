import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsNotIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Đánh giá tổng quát', required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return value?.trim();
  })
  assessment_type?: string | null;

  @ApiProperty({
    example: 'Tình trạng ổn định, cần theo dõi đường huyết thường xuyên',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return value?.trim();
  })
  notes?: string | null;

  @ApiProperty({
    example: 'Duy trì chế độ ăn kiêng, tập thể dục nhẹ, uống thuốc đúng giờ',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return null;
    return value?.trim();
  })
  recommendations?: string | null;

  @ApiProperty({
    example: '66b54634d29ee1e4a3e79952',
    description: 'ID của cư dân (resident)',
  })
  @IsMongoId()
  @IsNotEmpty()
  resident_id: string;

  @ApiProperty({
    example: '66b54634d29ee1e4a3e79951',
    description: 'ID của user (staff) thực hiện đánh giá',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  conducted_by?: string;
}
