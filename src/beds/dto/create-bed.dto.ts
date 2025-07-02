import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateBedDto {
  @ApiProperty({ example: 'B101' })
  @IsString()
  @IsNotEmpty()
  bedNumber: string;

  @ApiProperty({ example: 'R1' })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isOccupied?: boolean;

  @ApiProperty({ example: null, required: false })
  @IsOptional()
  residentId?: string;
} 