import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CarePlanStatus } from '../enums/care-plan-status.enum';

export class CreateCarePlanAssignmentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  resident_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  staff_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  care_plan_name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  end_date: string;

  @ApiProperty({ enum: CarePlanStatus })
  @IsOptional()
  @IsEnum(CarePlanStatus)
  status: CarePlanStatus;
} 