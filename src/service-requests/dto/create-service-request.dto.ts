import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { ServiceRequestType } from '../schemas/service-request.schema';

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsMongoId()
  resident_id: string;

  @ApiProperty()
  @IsMongoId()
  family_member_id: string;

  @ApiProperty({ enum: ServiceRequestType })
  @IsEnum(ServiceRequestType)
  request_type: ServiceRequestType;

  // Note is required for CARE_PLAN_CHANGE and ROOM_CHANGE
  @ApiPropertyOptional({ 
    description: 'Reason for the request (required for care plan change and room change)',
    required: false
  })
  @ValidateIf((o) => o.request_type === 'care_plan_change' || o.request_type === 'room_change')
  @IsString()
  note?: string;

  // For CARE_PLAN_CHANGE - will be created by the service
  @ApiPropertyOptional({ description: 'Target care plan assignment ID (created by service)' })
  @IsOptional()
  @IsMongoId()
  target_care_plan_assignment_id?: string;

  @ApiPropertyOptional({ description: 'Target bed assignment ID (created by service)' })
  @IsOptional()
  @IsMongoId()
  target_bed_assignment_id?: string;

  // For SERVICE_DATE_CHANGE
  @ApiPropertyOptional({ description: 'Current care plan assignment ID to extend' })
  @ValidateIf((o) => o.request_type === 'service_date_change')
  @IsMongoId()
  current_care_plan_assignment_id?: string;

  @ApiPropertyOptional({ description: 'New end date for service extension (ISO string)' })
  @ValidateIf((o) => o.request_type === 'service_date_change')
  @IsDateString()
  new_end_date?: string;


  @ApiProperty()
  @IsString()
  emergencyContactName: string;

  @ApiProperty()
  @IsString()
  emergencyContactPhone: string;

  @ApiProperty({ required: false })
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
