import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomTypeDto {
  @ApiProperty({ example: '2_bed', enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'], description: 'Mã loại phòng' })
  @IsString()
  @IsNotEmpty()
  room_type: '2_bed' | '3_bed' | '4_5_bed' | '6_8_bed';

  @ApiProperty({ example: 'Phòng 2 giường', description: 'Tên hiển thị loại phòng' })
  @IsString()
  @IsNotEmpty()
  type_name: string;

  @ApiProperty({ example: '2', description: 'Số giường trong loại phòng này' })
  @IsString()
  @IsNotEmpty()
  bed_count: string;

  @ApiProperty({ example: 5000000, description: 'Giá cố định hàng tháng cho loại phòng này (VND)', minimum: 0 })
  @IsNumber()
  @Min(0)
  monthly_price: number;

  @ApiPropertyOptional({ example: 'Phòng 2 giường, tiện nghi cơ bản', description: 'Mô tả về loại phòng' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['wifi', 'máy lạnh'], description: 'Tiện ích của loại phòng', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: true, description: 'Loại phòng có còn hoạt động không' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
