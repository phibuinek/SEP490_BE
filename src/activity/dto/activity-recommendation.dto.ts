import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, IsOptional, IsDateString } from 'class-validator';

export class ActivityRecommendationDto {
  @ApiProperty({ 
    example: ['664f1b2c2f8b2c0012a4e126'], 
    description: 'Danh sách resident_id',
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  resident_ids: string[];

  @ApiProperty({ 
    example: '2024-03-02T07:00:00.000Z', 
    description: 'Thời gian cụ thể cho hoạt động (ISO 8601 format)',
    required: false
  })
  @IsDateString()
  @IsOptional()
  schedule_time?: string;
} 