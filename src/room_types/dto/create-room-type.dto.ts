import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateRoomTypeDto {
  @ApiProperty({ example: '2_bed', description: 'Tên loại phòng' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Phòng 2 giường, có nhà vệ sinh riêng', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2000000, description: 'Giá phòng mỗi tháng' })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: ['Wifi', 'Điều hòa'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({ example: 'https://example.com/image.png', required: false })
  @IsString()
  @IsOptional()
  image?: string;
} 