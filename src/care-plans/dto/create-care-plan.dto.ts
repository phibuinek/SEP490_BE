import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCarePlanDto {
  @ApiProperty({ example: 'Gói Chăm Sóc Đặc Biệt' })
  @IsString()
  @IsNotEmpty()
  readonly planName: string;

  @ApiProperty({ example: 'Dành cho những người cao tuổi cần chăm sóc đặc biệt với tình trạng sức khỏe yếu.' })
  @IsString()
  @IsNotEmpty()
  readonly description: string;

  @ApiProperty({ example: 12000000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  readonly monthlyPrice: number;

  @ApiProperty({ example: 'cham_soc_dac_biet' })
  @IsString()
  @IsNotEmpty()
  readonly planType: string;

  @ApiProperty({ example: 'main' })
  @IsString()
  @IsNotEmpty()
  readonly category: string;

  @ApiProperty({ example: ['Ăn uống', 'Vệ sinh', 'Theo dõi sức khỏe'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly servicesIncluded: string[];

  @ApiProperty({ example: '1:3' })
  @IsString()
  @IsNotEmpty()
  readonly staffRatio: string;

  @ApiProperty({ example: 'monthly' })
  @IsString()
  @IsNotEmpty()
  readonly durationType: string;

  @ApiProperty({ example: ['Thuốc A', 'Thuốc B'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly defaultMedications: string[];

  @ApiProperty({ example: ['Không dị ứng', 'Có người thân chăm sóc'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly prerequisites: string[];

  @ApiProperty({ example: ['Dị ứng thuốc X'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly contraindications: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  readonly isActive: boolean;

  @ApiProperty({ example: '19001000', required: false })
  @IsString()
  @IsOptional()
  readonly hotline?: string;

  @ApiProperty({ example: 'Liên hệ quản lý khu A', required: false })
  @IsString()
  @IsOptional()
  readonly contactInfo?: string;

  @ApiProperty({ example: 'Ghi chú đặc biệt', required: false })
  @IsString()
  @IsOptional()
  readonly note?: string;

  @ApiProperty({ example: 'Điều khoản sử dụng dịch vụ', required: false })
  @IsString()
  @IsOptional()
  readonly terms?: string;
} 