import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';
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
import { Type, Transform } from 'class-transformer';
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
    example: 'con gái',
    description: 'Relationship with emergency contact (can be any string)'
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;
}

export class CreateResidentDto {
  @ApiProperty({
    example: 'Nguyễn Văn Nam',
    description: 'Full name of the resident',
  })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({
    example: '1950-05-15',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiPropertyOptional({
    example: '2024-01-15',
    description: 'Admission date in YYYY-MM-DD format (optional)',
  })
  @IsOptional()
  @IsDateString()
  admission_date?: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
    description: 'Gender of the resident',
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
    description: 'Avatar URL (optional)',
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiProperty({
    example: '664f1b2c2f8b2c0012a4e750',
    description: 'Family member ID (MongoDB ObjectId)',
  })
  @IsMongoId()
  family_member_id: string;

  @ApiProperty({
    example: 'con gái',
    description: 'Relationship with family member (can be any string)'
  })
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({
    example: '123456789012',
    description: 'CCCD ID of the resident (12 digits)',
  })
  @IsString()
  @Matches(/^[0-9]{12}$/, { message: 'CCCD ID must be exactly 12 digits' })
  cccd_id: string;

  @ApiPropertyOptional({
    example: 'uploads/cccd_front.jpg',
    description: 'CCCD front image path (optional)',
  })
  @IsOptional()
  @IsString()
  cccd_front?: string;

  @ApiPropertyOptional({
    example: 'uploads/cccd_back.jpg',
    description: 'CCCD back image path (optional)',
  })
  @IsOptional()
  @IsString()
  cccd_back?: string;

  @ApiProperty({
    example: '987654321098',
    description: 'CCCD ID of the family member (12 digits)',
  })
  @IsString()
  @Matches(/^[0-9]{12}$/, { message: 'Family member CCCD ID must be exactly 12 digits' })
  user_cccd_id: string;

  @ApiPropertyOptional({
    example: 'uploads/user_cccd_front.jpg',
    description: 'Family member CCCD front image path (optional)',
  })
  @IsOptional()
  @IsString()
  user_cccd_front?: string;

  @ApiPropertyOptional({
    example: 'uploads/user_cccd_back.jpg',
    description: 'Family member CCCD back image path (optional)',
  })
  @IsOptional()
  @IsString()
  user_cccd_back?: string;

  @ApiProperty({
    example: 'Cao huyết áp, tiểu đường type 2',
    description: 'Medical history of the resident',
  })
  @ApiPropertyOptional({
    example: 'Cao huyết áp, tiểu đường type 2',
    description: 'Medical history of the resident (optional)',
  })
  @IsOptional()
  @IsString()
  medical_history?: string;

  @ApiProperty({
    type: [MedicationDto],
    example: [
      { medication_name: 'Aspirin', dosage: '81mg', frequency: 'Sáng' },
    ],
    description: 'Current medications list',
  })
  @ApiPropertyOptional({
    type: [MedicationDto],
    example: [
      { medication_name: 'Aspirin', dosage: '81mg', frequency: 'Sáng' },
    ],
    description: 'Current medications list (optional)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  current_medications?: MedicationDto[];

  @ApiProperty({
    type: [String],
    example: ['Dị ứng hải sản'],
    description: 'List of allergies',
  })
  @ApiPropertyOptional({
    type: [String],
    example: ['Dị ứng hải sản'],
    description: 'List of allergies (optional)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @ApiProperty({
    type: EmergencyContactDto,
    description: 'Emergency contact information (required)',
  })
  @IsString()
  emergency_contact: any;

  @ApiProperty({
    type: 'string',
    description: 'Care plan assignment ID (required)',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsNotEmpty()
  care_plan_assignment_id: string;

  @ApiHideProperty()
  @IsOptional()
  @IsEnum(ResidentStatus)
  status?: ResidentStatus;
}
