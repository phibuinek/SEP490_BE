import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { AttendanceStatus } from '../schemas/activity-participation.schema';

export class CreateActivityParticipationDto {
  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e750' })
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e751' })
  @IsString()
  @IsNotEmpty()
  activityId: string;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e752' })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({ example: '2024-03-02T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 'Tham gia tích cực, tinh thần tốt', required: false })
  @IsString()
  @IsOptional()
  performanceNotes?: string;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PENDING })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  attendanceStatus: AttendanceStatus;
}
