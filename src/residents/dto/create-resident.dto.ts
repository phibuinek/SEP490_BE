import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateResidentDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Male', enum: ['Male', 'Female', 'Other'] })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '1950-01-01' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: Date;

  @ApiProperty({ example: 'Khỏe mạnh', required: false })
  @IsString()
  @IsOptional()
  healthStatus?: string;

  @ApiProperty({ example: ['Dị ứng phấn hoa'], required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiProperty({ example: 'Tiền sử cao huyết áp', required: false })
  @IsString()
  @IsOptional()
  medicalHistory?: string;
} 