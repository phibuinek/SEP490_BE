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
  @ApiPropertyOptional({ 
    enum: ['male', 'female'],
    example: 'female',
    description: 'Giới tính phòng mong muốn'
  })
  @IsOptional()
  @IsEnum(['male', 'female'])
  preferred_room_gender?: 'male' | 'female';

  @ApiPropertyOptional({
    example: 2,
    description: 'Tầng mong muốn (1-5)'
  })
  @IsOptional()
  @IsNumber()
  preferred_floor?: number;

  @ApiPropertyOptional({
    example: 'Gần cửa sổ, yên tĩnh, có ban công',
    description: 'Yêu cầu đặc biệt khác'
  })
  @IsOptional()
  @IsString()
  special_requests?: string;
}

export class AdditionalMedicationDto {
  @ApiProperty({
    example: 'Vitamin D3',
    description: 'Tên thuốc/thực phẩm chức năng'
  })
  @IsString()
  @IsNotEmpty()
  medication_name: string;

  @ApiProperty({
    example: '1000 IU',
    description: 'Liều lượng sử dụng'
  })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({
    example: '1 viên/ngày sau bữa sáng',
    description: 'Tần suất sử dụng'
  })
  @IsString()
  @IsNotEmpty()
  frequency: string;
}

export class CreateCarePlanAssignmentDto {
  @ApiProperty({
    type: [String],
    description: 'Mảng ID các gói chăm sóc (chính + phụ)',
    example: ['507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013']
  })
  @IsArray()
  @IsMongoId({ each: true })
  care_plan_ids: string[];

  @ApiProperty({ 
    description: 'ID người cao tuổi',
    example: '507f1f77bcf86cd799439014'
  })
  @IsMongoId()
  resident_id: string;

  @ApiPropertyOptional({ 
    description: 'Ngày đăng ký ban đầu',
    example: '2024-01-15T00:00:00.000Z'
  })
  @IsOptional()
  @IsDateString()
  registration_date?: string;

  @ApiPropertyOptional({ 
    description: 'Ghi chú tư vấn của nhân viên',
    example: 'Người cao tuổi có nhu cầu chăm sóc đặc biệt, cần theo dõi huyết áp hàng ngày'
  })
  @IsOptional()
  @IsString()
  consultation_notes?: string;

  @ApiProperty({
    enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'],
    description: 'Loại phòng đã chọn',
    example: '2_bed'
  })
  @IsEnum(['2_bed', '3_bed', '4_5_bed', '6_8_bed'])
  selected_room_type: string;

  @ApiPropertyOptional({ 
    description: 'ID phòng được phân bổ',
    example: '507f1f77bcf86cd799439015'
  })
  @IsOptional()
  @IsMongoId()
  assigned_room_id?: string;

  @ApiPropertyOptional({
    description: 'ID giường được phân (null nếu chưa phân)',
    example: '507f1f77bcf86cd799439016'
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
    example: 5000000
  })
  @IsNumber()
  @Min(0)
  total_monthly_cost: number;

  @ApiProperty({
    description: 'Chi phí phòng hàng tháng',
    minimum: 0,
    example: 2000000
  })
  @IsNumber()
  @Min(0)
  room_monthly_cost: number;

  @ApiProperty({
    description: 'Chi phí các gói chăm sóc hàng tháng',
    minimum: 0,
    example: 3000000
  })
  @IsNumber()
  @Min(0)
  care_plans_monthly_cost: number;

  @ApiProperty({ 
    description: 'Ngày bắt đầu',
    example: '2024-02-01T00:00:00.000Z'
  })
  @IsDateString()
  start_date: string;

  @ApiPropertyOptional({ 
    description: 'Ngày kết thúc (có thể null)',
    example: '2024-12-31T23:59:59.000Z'
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    type: [AdditionalMedicationDto],
    description: 'Thuốc/thực phẩm chức năng bổ sung',
    example: [
      {
        medication_name: 'Vitamin D3',
        dosage: '1000 IU',
        frequency: '1 viên/ngày sau bữa sáng'
      },
      {
        medication_name: 'Omega 3',
        dosage: '1000mg',
        frequency: '1 viên/ngày trước bữa tối'
      }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalMedicationDto)
  additional_medications?: AdditionalMedicationDto[];

  @ApiPropertyOptional({
    enum: [
      'pending',
      'accepted',
      'active',
      'rejected',
      'completed',
      'cancelled',
      'paused',
    ],
    description: 'Trạng thái đăng ký và chăm sóc',
    default: 'pending',
    example: 'pending'
  })
  @IsOptional()
  @IsEnum([
    'pending',
    'accepted',
    'active',
    'rejected',
    'completed',
    'cancelled',
    'paused',
  ])
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Ghi chú của nhân viên',
    example: 'Gia đình yêu cầu chăm sóc đặc biệt vào buổi sáng, cần thông báo trước khi thay đổi lịch'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
