import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsMongoId,
  IsObject,
  IsNumberString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, ResidentStatus } from '../schemas/resident.schema';

export class MedicationDto {
  @ApiProperty({ example: 'Aspirin 81mg' })
  @IsString()
  @IsNotEmpty()
  medication_name: string;

  @ApiProperty({ example: '1 viên/ngày' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: 'Sáng' })
  @IsString()
  @IsNotEmpty()
  frequency: string;
}

export class EmergencyContactDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @Matches(/^[0-9]{10,15}$/)
  phone: string;

  @ApiProperty({
    enum: [
      'con trai',
      'con gái',
      'cháu trai',
      'cháu gái',
      'anh em',
      'vợ/chồng',
      'khác',
    ],
    example: 'con gái',
  })
  @IsEnum([
    'con trai',
    'con gái',
    'cháu trai',
    'cháu gái',
    'anh em',
    'vợ/chồng',
    'khác',
  ])
  relationship: string;
}

export class CreateResidentDto {
  @ApiProperty({ example: 'Nguyễn Văn Nam' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: '1950-05-15' })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiProperty({ example: '2024-01-10' })
  @IsDateString()
  @IsNotEmpty()
  admission_date: string;

  @ApiPropertyOptional({ example: '2024-06-01', nullable: true })
  @IsOptional()
  @IsDateString()
  discharge_date?: string | null;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e750' })
  @IsMongoId()
  family_member_id: string;

  @ApiProperty({
    enum: [
      'con trai',
      'con gái',
      'cháu trai',
      'cháu gái',
      'anh em',
      'vợ/chồng',
      'khác',
    ],
    example: 'con gái',
  })
  @IsEnum([
    'con trai',
    'con gái',
    'cháu trai',
    'cháu gái',
    'anh em',
    'vợ/chồng',
    'khác',
  ])
  relationship: string;

  @ApiProperty({ example: 'Cao huyết áp, tiểu đường type 2' })
  @IsString()
  @IsNotEmpty()
  medical_history: string;

  @ApiProperty({ type: [MedicationDto], example: [{ medication_name: 'Aspirin', dosage: '81mg', frequency: 'Sáng' }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  current_medications: MedicationDto[];

  @ApiProperty({ type: [String], example: ['Dị ứng hải sản'] })
  @IsArray()
  @IsString({ each: true })
  allergies: string[];

  @ApiProperty({ type: EmergencyContactDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergency_contact: EmergencyContactDto;

  @ApiProperty({ enum: ResidentStatus, example: ResidentStatus.ACTIVE })
  @IsEnum(ResidentStatus)
  status: ResidentStatus;

  @ApiProperty({ example: '2024-01-10T10:00:00.000Z' })
  @IsDateString()
  created_at: string;

  @ApiProperty({ example: '2024-01-10T10:00:00.000Z' })
  @IsDateString()
  updated_at: string;
}
