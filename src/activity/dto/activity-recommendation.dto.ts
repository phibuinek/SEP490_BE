import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

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
    example: ['sáng', 'chiều'], 
    description: 'Các buổi muốn đề xuất hoạt động (sáng, trưa, chiều, tối)',
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  timesOfDay: string[];
} 