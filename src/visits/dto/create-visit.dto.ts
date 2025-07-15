import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateVisitDto {
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
