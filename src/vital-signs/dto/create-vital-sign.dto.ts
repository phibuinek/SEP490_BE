import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsMongoId,
} from 'class-validator';

export class CreateVitalSignDto {
  @ApiProperty({
    example: '664f1b2c2f8b2c0012a4e750',
    description: 'Resident ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  resident_id: string;

  @ApiProperty({ example: 36.5, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 75, required: false })
  @IsNumber()
  @IsOptional()
  heart_rate?: number;

  @ApiProperty({ example: '130/80', required: false })
  @IsString()
  @IsOptional()
  blood_pressure?: string;

  @ApiProperty({ example: 18, required: false })
  @IsNumber()
  @IsOptional()
  respiratory_rate?: number;

  @ApiProperty({ example: 98.5, required: false })
  @IsNumber()
  @IsOptional()
  oxygen_level?: number;

  @ApiProperty({ example: 65.5, required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ example: 'Các chỉ số bình thường', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
