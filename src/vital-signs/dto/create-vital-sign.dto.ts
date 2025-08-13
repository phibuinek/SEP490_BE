import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsMongoId,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateVitalSignDto {
  @ApiProperty({
    example: '664f1b2c2f8b2c0012a4e750',
    description: 'Resident ID',
  })
  @IsNotEmpty({ message: 'ID người cao tuổi là bắt buộc' })
  resident_id: string;

  @ApiProperty({ example: 36.5, required: false })
  @IsOptional()
  // @Type(() => Number)
  // @IsNumber({}, { message: 'Nhiệt độ phải là số' })
  // @Min(30, { message: 'Nhiệt độ phải lớn hơn hoặc bằng 30°C' })
  // @Max(45, { message: 'Nhiệt độ phải nhỏ hơn hoặc bằng 45°C' })
  temperature?: number;

  @ApiProperty({ example: 75, required: false })
  @IsOptional()
  // @Type(() => Number)
  // @IsNumber({}, { message: 'Nhịp tim phải là số' })
  // @IsPositive({ message: 'Nhịp tim phải là số dương' })
  // @Min(30, { message: 'Nhịp tim phải lớn hơn hoặc bằng 30 bpm' })
  // @Max(200, { message: 'Nhịp tim phải nhỏ hơn hoặc bằng 200 bpm' })
  heart_rate?: number;

  @ApiProperty({ example: '130/80', required: false })
  @IsOptional()
  @IsString({ message: 'Huyết áp phải là chuỗi ký tự' })
  @Transform(({ value }) => value?.trim())
  blood_pressure?: string;

  @ApiProperty({ example: 18, required: false })
  @IsOptional()
  // @Type(() => Number)
  // @IsNumber({}, { message: 'Nhịp thở phải là số' })
  // @IsPositive({ message: 'Nhịp thở phải là số dương' })
  // @Min(5, { message: 'Nhịp thở phải lớn hơn hoặc bằng 5 lần/phút' })
  // @Max(50, { message: 'Nhịp thở phải nhỏ hơn hoặc bằng 50 lần/phút' })
  respiratory_rate?: number;

  @ApiProperty({ example: 98.5, required: false })
  @IsOptional()
  // @Type(() => Number)
  // @IsNumber({}, { message: 'Nồng độ oxy phải là số' })
  // @Min(70, { message: 'Nồng độ oxy phải lớn hơn hoặc bằng 70%' })
  // @Max(100, { message: 'Nồng độ oxy phải nhỏ hơn hoặc bằng 100%' })
  oxygen_level?: number;

  @ApiProperty({ example: 65.5, required: false })
  @IsOptional()
  // @Type(() => Number)
  // @IsNumber({}, { message: 'Cân nặng phải là số' })
  // @IsPositive({ message: 'Cân nặng phải là số dương' })
  // @Min(20, { message: 'Cân nặng phải lớn hơn hoặc bằng 20kg' })
  // @Max(200, { message: 'Cân nặng phải nhỏ hơn hoặc bằng 200kg' })
  weight?: number;

  @ApiProperty({ example: 'Các chỉ số bình thường', required: false })
  // @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  // @Transform(({ value }) => value?.trim())
  notes?: string;
}
