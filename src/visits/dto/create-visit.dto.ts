import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty()
  @IsMongoId()
  resident_id: string;

  @ApiProperty()
  @IsString()
  visit_time: string;

  @ApiProperty()
  @IsDateString()
  visit_date: Date;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsString()
  purpose: string;

  @ApiProperty()
  @IsNumber()
  numberOfVisitors: number;
} 