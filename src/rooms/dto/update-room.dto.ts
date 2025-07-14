import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiPropertyOptional({ example: '101A' })
  room_number?: string;

  @ApiPropertyOptional({ example: 2, enum: [2, 3, 4, 5, 6, 7, 8] })
  bed_count?: number;

  @ApiPropertyOptional({ example: '2_bed', enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'] })
  room_type?: string;

  @ApiPropertyOptional({ example: 'male', enum: ['male', 'female'] })
  gender?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  floor?: number;

  @ApiPropertyOptional({ example: '60d21b4667d0d8992e610c85', type: String })
  main_care_plan_id?: string;

  @ApiPropertyOptional({ example: 'available', enum: ['available', 'occupied', 'maintenance', 'reserved'] })
  status?: string;
} 