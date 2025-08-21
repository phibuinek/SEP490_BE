import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty()
  @IsString()
  resident_id: string;

  @ApiProperty()
  @IsString()
  visit_time: string;

  @ApiProperty()
  @IsDateString()
  visit_date: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty()
  @IsString()
  purpose: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  numberOfVisitors: number;

  @ApiProperty({ required: false, enum: ['completed', 'cancelled'], default: 'completed' })
  @IsOptional()
  @IsEnum(['completed', 'cancelled'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
