import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ example: 'Tập thể dục buổi sáng' })
  @IsString()
  @IsNotEmpty()
  activity_name: string;

  @ApiProperty({ example: 'Các bài tập nhẹ nhàng phù hợp với người cao tuổi' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 45, description: 'Duration in minutes' })
  @IsNumber()
  @IsPositive()
  duration: number;

  @ApiProperty({ example: '2024-03-02T07:00:00' })
  @IsString()
  @IsNotEmpty()
  schedule_time: string;

  @ApiProperty({ example: 'Sân vườn' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @IsPositive()
  capacity: number;

  @ApiProperty({ example: 'Thể dục', description: 'Loại hoạt động' })
  @IsString()
  @IsNotEmpty()
  activity_type: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Staff ID who will conduct the activity' })
  @IsString()
  @IsNotEmpty()
  staff_id: string;
}
