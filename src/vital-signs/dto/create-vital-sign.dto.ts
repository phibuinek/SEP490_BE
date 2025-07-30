import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsMongoId,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateVitalSignDto {
  @ApiProperty({
    example: '664f1b2c2f8b2c0012a4e750',
    description: 'Resident ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  resident_id: string;

  @ApiProperty({ example: 36.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number;

  @ApiProperty({ example: 75, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(30)
  @Max(200)
  heart_rate?: number;

  @ApiProperty({ example: '130/80', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  blood_pressure?: string;

  @ApiProperty({ example: 18, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(5)
  @Max(50)
  respiratory_rate?: number;

  @ApiProperty({ example: 98.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(70)
  @Max(100)
  oxygen_level?: number;

  @ApiProperty({ example: 65.5, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(20)
  @Max(200)
  weight?: number;

  @ApiProperty({ example: 'Các chỉ số bình thường', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
