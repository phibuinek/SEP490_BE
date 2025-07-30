import { IsMongoId, IsString, IsOptional, IsArray, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../schemas/staff-assignment.schema';

export class CreateStaffAssignmentDto {
  @ApiProperty({ description: 'ID của nhân viên' })
  @IsMongoId()
  staff_id: string;

  @ApiProperty({ description: 'ID của cư dân' })
  @IsMongoId()
  resident_id: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc phân công (có thể null)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ 
    enum: AssignmentStatus,
    description: 'Trạng thái phân công',
    default: AssignmentStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Ghi chú phân công' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Danh sách trách nhiệm',
    example: ['vital_signs', 'care_notes', 'activities', 'photos']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];
} 