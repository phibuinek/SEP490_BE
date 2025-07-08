import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { BedStatus } from '../schemas/bed.schema';

export class CreateBedDto {
  @ApiProperty({ example: '101-A' })
  @IsString()
  @IsNotEmpty()
  bedNumber: string;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e750' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'Bed A1', description: 'Bed name or identifier' })
  @IsString()
  @IsNotEmpty()
  bedName: string;

  @ApiProperty({ example: 'Single bed with adjustable height', description: 'Description of the bed' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'available', enum: ['available', 'occupied', 'maintenance'], description: 'Current status of the bed' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e751', required: false })
  @IsString()
  @IsOptional()
  residentId?: string;
} 