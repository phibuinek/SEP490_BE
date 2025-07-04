import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';

export class CreateCarePlanDto {
  @ApiProperty({ example: 'Gói Chăm Sóc Tiêu Chuẩn' })
  @IsString()
  @IsNotEmpty()
  planName: string;

  @ApiProperty({ example: 'Gói chăm sóc cơ bản cho người cao tuổi' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 6000000 })
  @IsNumber()
  @IsNotEmpty()
  monthlyPrice: number;

  @ApiProperty({ example: 'cham_soc_tieu_chuan' })
  @IsString()
  @IsNotEmpty()
  planType: string;

  @ApiProperty({ example: 'main' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ type: [String], example: ['Chăm sóc y tế 24/7', '3 bữa ăn chính'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  servicesIncluded?: string[];

  @ApiProperty({ example: '1:8' })
  @IsString()
  @IsNotEmpty()
  staffRatio: string;

  @ApiProperty({ example: 'monthly' })
  @IsString()
  @IsNotEmpty()
  durationType: string;

  @ApiProperty({ type: [String], example: [], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  defaultMedications?: string[];

  @ApiProperty({ type: [String], example: ['Yêu cầu sức khỏe ổn định'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  prerequisites?: string[];

  @ApiProperty({ type: [String], example: [], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  contraindications?: string[];

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 