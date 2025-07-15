import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FamilyPreferencesDto {
  @ApiPropertyOptional({ enum: ['male', 'female'] })
  @IsOptional()
  @IsEnum(['male', 'female'])
  preferred_room_gender?: 'male' | 'female';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  preferred_floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  special_requests?: string;
}

export class AdditionalMedicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medication_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frequency: string;
}

export class CreateCarePlanAssignmentDto {
  @ApiProperty({
    type: [String],
    description: 'Mảng ID các gói chăm sóc (chính + phụ)',
  })
  @IsArray()
  @IsMongoId({ each: true })
  care_plan_ids: string[];

  @ApiProperty({ description: 'ID người cao tuổi' })
  @IsMongoId()
  resident_id: string;

  @ApiPropertyOptional({ description: 'Ghi chú tư vấn của nhân viên' })
  @IsOptional()
  @IsString()
  consultation_notes?: string;

  @ApiProperty({
    enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'],
    description: 'Loại phòng đã chọn',
  })
  @IsEnum(['2_bed', '3_bed', '4_5_bed', '6_8_bed'])
  selected_room_type: string;

  @ApiPropertyOptional({ description: 'ID phòng được phân bổ' })
  @IsOptional()
  @IsMongoId()
  assigned_room_id?: string;

  @ApiPropertyOptional({
    description: 'ID giường được phân (null nếu chưa phân)',
  })
  @IsOptional()
  @IsMongoId()
  assigned_bed_id?: string;

  @ApiPropertyOptional({
    type: FamilyPreferencesDto,
    description: 'Yêu cầu đặc biệt của gia đình',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FamilyPreferencesDto)
  family_preferences?: FamilyPreferencesDto;

  @ApiProperty({
    description: 'Tổng chi phí tháng = gói chăm sóc + phòng',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total_monthly_cost: number;

  @ApiProperty({
    description: 'Chi phí phòng hàng tháng',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  room_monthly_cost: number;

  @ApiProperty({
    description: 'Chi phí các gói chăm sóc hàng tháng',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  care_plans_monthly_cost: number;

  @ApiProperty({ description: 'Ngày bắt đầu' })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (có thể null)' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    type: [AdditionalMedicationDto],
    description: 'Thuốc/thực phẩm chức năng bổ sung',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalMedicationDto)
  additional_medications?: AdditionalMedicationDto[];

  @ApiProperty({
    enum: [
      'consulting',
      'packages_selected',
      'room_assigned',
      'payment_completed',
      'active',
      'completed',
      'cancelled',
      'paused',
    ],
    description: 'Trạng thái đăng ký và chăm sóc',
  })
  @IsEnum([
    'consulting',
    'packages_selected',
    'room_assigned',
    'payment_completed',
    'active',
    'completed',
    'cancelled',
    'paused',
  ])
  status: string;

  @ApiPropertyOptional({ description: 'Ghi chú của nhân viên' })
  @IsOptional()
  @IsString()
  notes?: string;
}
