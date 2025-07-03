import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ActivityStatus } from '../schemas/activity.schema';

export class CreateActivityDto {
  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e123', description: 'Resident ID' })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({ example: 'Tập thể dục buổi sáng' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Tập các bài tập nhẹ nhàng cho người cao tuổi' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2024-06-01T08:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 'Phòng tập thể dục' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e124', description: 'Assigned staff ID' })
  @IsString()
  @IsNotEmpty()
  assignedTo: string;

  @ApiProperty({ example: 'Bệnh nhân tham gia tích cực', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: ActivityStatus, example: ActivityStatus.PLANNED })
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;
} 