import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateVitalSignDto {
  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e7f', description: 'Resident ID' })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({ example: '2024-03-01T08:00:00Z', description: 'Date and time of measurement' })
  @IsDateString()
  @IsNotEmpty()
  dateTime: Date;

  @ApiProperty({ example: 36.5, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 75, required: false })
  @IsNumber()
  @IsOptional()
  heartRate?: number;

  @ApiProperty({ example: '130/80', required: false })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiProperty({ example: 18, required: false })
  @IsNumber()
  @IsOptional()
  respiratoryRate?: number;

  @ApiProperty({ example: 98.5, required: false })
  @IsNumber()
  @IsOptional()
  oxygenLevel?: number;

  @ApiProperty({ example: 65.5, required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ example: 'Các chỉ số bình thường', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
} 