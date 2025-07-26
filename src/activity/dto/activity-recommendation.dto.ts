import { ApiProperty } from '@nestjs/swagger';

export class ActivityRecommendationDto {
  @ApiProperty({ example: ['664f1b2c2f8b2c0012a4e126'], description: 'Danh sách resident_id' })
  resident_ids: string[];

  @ApiProperty({ example: ['sáng', 'chiều'], description: 'Các buổi muốn đề xuất hoạt động (sáng, trưa, chiều, tối)' })
  timesOfDay: string[];
} 