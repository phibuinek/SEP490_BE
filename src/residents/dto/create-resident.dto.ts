import {
  IsString,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsArray,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class EmergencyContactDto {
  @ApiProperty({ example: 'Nguyễn Thị Hoa' })
  @IsString()
  name: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'con gái' })
  @IsString()
  relationship: string;
}

class MedicationDto {
  @ApiProperty({ example: 'Metformin' })
  @IsString()
  medication_name: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: '2 lần/ngày' })
  @IsString()
  frequency: string;
}

export class CreateResidentDto {
  @ApiProperty({ example: 'Nguyễn Văn Nam' })
  @IsString()
  full_name: string;

  @ApiProperty({ example: '1950-05-15' })
  @IsDateString()
  date_of_birth: string;

  @ApiProperty({ enum: ['male', 'female'], example: 'male' })
  @IsEnum(['male', 'female'])
  gender: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: '2024-01-10' })
  @IsDateString()
  admission_date: string;

  @ApiPropertyOptional({ example: '2025-01-10' })
  @IsOptional()
  @IsDateString()
  discharge_date?: string;

  @ApiProperty({ description: 'ID của người thân (user có role family)', example: '60d...' })
  @IsMongoId()
  family_member_id: string;

  @ApiProperty({ example: 'Cao huyết áp, tiểu đường type 2' })
  @IsString()
  medical_history: string;

  @ApiPropertyOptional({ type: [MedicationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  current_medications?: MedicationDto[];

  @ApiPropertyOptional({ example: ['Penicillin'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({ type: EmergencyContactDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergency_contact: EmergencyContactDto;

  @ApiProperty({ enum: ['basic', 'intermediate', 'intensive', 'specialized'], example: 'intermediate' })
  @IsEnum(['basic', 'intermediate', 'intensive', 'specialized'])
  care_level: string;

  @ApiProperty({ enum: ['active', 'discharged', 'deceased'], example: 'active' })
  @IsEnum(['active', 'discharged', 'deceased'])
  status: string;
} 