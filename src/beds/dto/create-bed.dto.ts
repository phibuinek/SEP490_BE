import { IsString, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBedDto {
  @ApiProperty({ example: 'B01' })
  @IsString()
  bed_number: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85', type: String })
  @IsMongoId()
  room_id: string;

  @ApiProperty({
    example: 'standard',
    enum: ['standard', 'electric', 'medical'],
  })
  @IsString()
  @IsEnum(['standard', 'electric', 'medical'])
  bed_type: string;

  @ApiProperty({
    example: 'available',
    enum: ['available', 'occupied', 'maintenance'],
  })
  @IsString()
  @IsEnum(['available', 'occupied', 'maintenance'])
  status: string;
}
