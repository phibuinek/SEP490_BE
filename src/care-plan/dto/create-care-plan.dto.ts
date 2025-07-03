import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { CarePlanStatus, CarePlanPriority } from '../schemas/care-plan.schema';

class TaskDto {
  @ApiProperty({ example: 'Kiểm tra huyết áp hàng ngày' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Đo huyết áp vào buổi sáng và tối', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @ApiProperty({ example: '2024-06-15', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;
}

export class CreateCarePlanDto {
  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e123', description: 'Resident ID' })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({ example: 'Kế hoạch chăm sóc sức khỏe tổng quát' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Kế hoạch chăm sóc sức khỏe cho bệnh nhân cao tuổi' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2024-06-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({ enum: CarePlanStatus, example: CarePlanStatus.DRAFT })
  @IsEnum(CarePlanStatus)
  @IsOptional()
  status?: CarePlanStatus;

  @ApiProperty({ enum: CarePlanPriority, example: CarePlanPriority.MEDIUM })
  @IsEnum(CarePlanPriority)
  @IsOptional()
  priority?: CarePlanPriority;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e124', description: 'Assigned staff ID' })
  @IsString()
  @IsNotEmpty()
  assignedTo: string;

  @ApiProperty({ type: [TaskDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  @IsOptional()
  tasks?: TaskDto[];

  @ApiProperty({ example: 'Ghi chú bổ sung cho kế hoạch chăm sóc', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
} 