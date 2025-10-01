import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { ServiceRequestType } from '../schemas/service-request.schema';

export class CreateServiceRequestDto {
  @ApiProperty({ 
    description: 'Resident ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  resident_id: string;

  @ApiProperty({ 
    description: 'Family member ID',
    example: '507f1f77bcf86cd799439012'
  })
  @IsMongoId()
  family_member_id: string;

  @ApiProperty({ 
    enum: ServiceRequestType,
    description: 'Type of service request',
    example: ServiceRequestType.CARE_PLAN_CHANGE
  })
  @IsEnum(ServiceRequestType)
  request_type: ServiceRequestType;

  // Note is required for CARE_PLAN_CHANGE and ROOM_CHANGE
  @ApiPropertyOptional({ 
    description: 'Reason for the request (required for care plan change and room change)',
    example: 'Cần thay đổi gói dịch vụ do tình trạng sức khỏe của cư dân',
    required: false
  })
  @ValidateIf((o) => o.request_type === 'care_plan_change' || o.request_type === 'room_change')
  @IsString()
  note?: string;

  // For CARE_PLAN_CHANGE - required fields
  @ApiPropertyOptional({ 
    description: 'Target care plan assignment ID (required for care plan change)',
    example: '507f1f77bcf86cd799439013'
  })
  @ValidateIf((o) => o.request_type === 'care_plan_change')
  @IsMongoId()
  target_care_plan_assignment_id?: string;

  // For CARE_PLAN_CHANGE and ROOM_CHANGE - required field
  @ApiPropertyOptional({ 
    description: 'Target bed assignment ID (required for care plan change and room change)',
    example: '507f1f77bcf86cd799439014'
  })
  @ValidateIf((o) => o.request_type === 'care_plan_change' || o.request_type === 'room_change')
  @IsMongoId()
  target_bed_assignment_id?: string;

  // For SERVICE_DATE_CHANGE
  @ApiPropertyOptional({ 
    description: 'Current care plan assignment ID to extend',
    example: '507f1f77bcf86cd799439015'
  })
  @ValidateIf((o) => o.request_type === 'service_date_change')
  @IsMongoId()
  current_care_plan_assignment_id?: string;

  @ApiPropertyOptional({ 
    description: 'New end date for service extension (ISO string)',
    example: '2024-12-31T23:59:59.000Z'
  })
  @ValidateIf((o) => o.request_type === 'service_date_change')
  @IsDateString()
  new_end_date?: string;

  @ApiProperty({ 
    description: 'Emergency contact name',
    example: 'Nguyễn Văn A'
  })
  @IsString()
  emergencyContactName: string;

  @ApiProperty({ 
    description: 'Emergency contact phone number',
    example: '0901234567'
  })
  @IsString()
  emergencyContactPhone: string;

  @ApiProperty({ 
    description: 'Medical notes about the resident',
    example: 'Cư dân cần chăm sóc đặc biệt do bệnh tim',
    required: false 
  })
  @IsOptional()
  @IsString()
  medicalNote?: string;

  // Legacy fields for backward compatibility
  @ApiPropertyOptional({ description: 'New service package ID when changing care plan (legacy)' })
  @IsOptional()
  @IsMongoId()
  target_service_package_id?: string;

  @ApiPropertyOptional({ description: 'New start date (ISO string) (legacy)' })
  @IsOptional()
  @IsDateString()
  new_start_date?: string;

  @ApiPropertyOptional({ description: 'Target room id when requesting room change (legacy)' })
  @IsOptional()
  @IsMongoId()
  target_room_id?: string;

  @ApiPropertyOptional({ description: 'Target bed id when requesting room change (legacy)' })
  @IsOptional()
  @IsMongoId()
  target_bed_id?: string;

  @ApiPropertyOptional({ description: 'Rejection reason when rejecting request' })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
