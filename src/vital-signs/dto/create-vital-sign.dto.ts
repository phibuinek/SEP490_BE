import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateVitalSignDto {
  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e123', description: 'Resident ID' })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({ example: '2024-06-01', description: 'Date of measurement' })
  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: '120/80', required: false })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiProperty({ example: 75, required: false })
  @IsNumber()
  @IsOptional()
  heartRate?: number;

  @ApiProperty({ example: 36.5, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 60, required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ example: 'Bệnh nhân ổn định', required: false })
  @IsString()
  @IsOptional()
  note?: string;
} 