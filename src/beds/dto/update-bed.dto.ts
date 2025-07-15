import { PartialType } from '@nestjs/mapped-types';
import { CreateBedDto } from './create-bed.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBedDto extends PartialType(CreateBedDto) {
  @ApiPropertyOptional({ example: 'B01' })
  bed_number?: string;

  @ApiPropertyOptional({ example: '60d21b4667d0d8992e610c85', type: String })
  room_id?: string;

  @ApiPropertyOptional({
    example: 'standard',
    enum: ['standard', 'electric', 'medical'],
  })
  bed_type?: string;

  @ApiPropertyOptional({
    example: 'available',
    enum: ['available', 'occupied', 'maintenance'],
  })
  status?: string;
}
