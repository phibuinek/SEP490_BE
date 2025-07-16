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
  readonly plan_name: string;

  @ApiProperty({
    example:
      'Dành cho những người cao tuổi cần chăm sóc đặc biệt với tình trạng sức khỏe yếu.',
  })
  @IsString()
  @IsNotEmpty()
  readonly description: string;

  @ApiProperty({ example: 12000000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  readonly monthly_price: number;

  @ApiProperty({ example: 'cham_soc_dac_biet' })
  @IsString()
  @IsNotEmpty()
  readonly plan_type: string;

  @ApiProperty({ example: 'main' })
  @IsString()
  @IsNotEmpty()
  readonly category: string;

  @ApiProperty({ example: ['Ăn uống', 'Vệ sinh', 'Theo dõi sức khỏe'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly services_included: string[];

  @ApiProperty({ example: '1:3' })
  @IsString()
  @IsNotEmpty()
  readonly staff_ratio: string;

  @ApiProperty({ example: 'monthly' })
  @IsString()
  @IsNotEmpty()
  readonly duration_type: string;

  @ApiProperty({ example: ['Thuốc A', 'Thuốc B'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly default_medications: string[];

  @ApiProperty({
    example: ['Không dị ứng', 'Có người thân chăm sóc'],
    required: false,
  })
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
  readonly is_active: boolean;
}
