import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, CareLevel, ResidentStatus } from '../schemas/resident.schema';

class EmergencyContactDto {
  @ApiProperty({ example: 'Trần Thị B' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Con gái' })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class CreateResidentDto {
  @ApiProperty({ example: 'Nguyễn Văn Nam' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '1950-05-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: Date;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @ApiProperty({ example: '2024-01-10' })
  @IsDateString()
  @IsNotEmpty()
  admissionDate: Date;

  @ApiProperty({ example: null, required: false })
  @IsDateString()
  @IsOptional()
  dischargeDate?: Date;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e126', required: false })
  @IsString()
  @IsOptional()
  familyMemberId?: string;

  @ApiProperty({ example: 'Cao huyết áp, tiểu đường type 2', required: false })
  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @ApiProperty({ type: [String], example: ['Aspirin 81mg', 'Metformin 500mg'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  currentMedications?: string[];

  @ApiProperty({ type: [String], example: ['Dị ứng hải sản'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiProperty({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsNotEmpty()
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ enum: CareLevel, example: CareLevel.INTERMEDIATE })
  @IsEnum(CareLevel)
  @IsNotEmpty()
  careLevel: CareLevel;

  @ApiProperty({ enum: ResidentStatus, example: ResidentStatus.ACTIVE, required: false })
  @IsEnum(ResidentStatus)
  @IsOptional()
  status?: ResidentStatus;
} 