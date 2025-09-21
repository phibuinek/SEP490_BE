import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsEnum, IsDateString } from 'class-validator';
import { ServiceRequestType } from '../service-request.schema';

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

  // For care plan change
  @ApiPropertyOptional({ description: 'New service package ID when changing care plan' })
  @IsOptional()
  @IsMongoId()
  target_service_package_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  // For date change
  @ApiPropertyOptional({ description: 'New start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  new_start_date?: string;

  @ApiPropertyOptional({ description: 'New end date (ISO string)' })
  @IsOptional()
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

  // For room change
  @ApiPropertyOptional({ description: 'Target room id when requesting room change' })
  @IsOptional()
  @IsMongoId()
  target_room_id?: string;

  @ApiPropertyOptional({ description: 'Target bed id when requesting room change' })
  @IsOptional()
  @IsMongoId()
  target_bed_id?: string;
}
