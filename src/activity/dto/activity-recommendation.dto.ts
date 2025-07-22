import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ActivityRecommendationDto {
  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e750', description: 'ID của người cao tuổi' })
  @IsString()
  resident_id: string;
} 