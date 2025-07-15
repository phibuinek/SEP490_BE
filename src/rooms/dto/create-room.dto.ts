import { IsString, IsInt, IsEnum, IsMongoId, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: '101A' })
  @IsString()
  room_number: string;

  @ApiProperty({ example: 2, enum: [2, 3, 4, 5, 6, 7, 8] })
  @IsInt()
  @IsEnum([2, 3, 4, 5, 6, 7, 8])
  bed_count: number;

  @ApiProperty({
    example: '2_bed',
    enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'],
  })
  @IsString()
  @IsEnum(['2_bed', '3_bed', '4_5_bed', '6_8_bed'])
  room_type: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female'] })
  @IsString()
  @IsEnum(['male', 'female'])
  gender: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  floor: number;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85', type: String })
  @IsMongoId()
  main_care_plan_id: string;

  @ApiProperty({
    example: 'available',
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
  })
  @IsString()
  @IsEnum(['available', 'occupied', 'maintenance', 'reserved'])
  status: string;
}
