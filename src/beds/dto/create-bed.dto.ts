import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { BedStatus } from '../schemas/bed.schema';

export class CreateBedDto {
  @ApiProperty({ example: '101-A' })
  @IsString()
  @IsNotEmpty()
  bedNumber: string;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e128' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'standard', default: 'standard' })
  @IsString()
  @IsOptional()
  bedType?: string;

  @ApiProperty({ enum: BedStatus, example: BedStatus.AVAILABLE })
  @IsEnum(BedStatus)
  @IsOptional()
  status?: BedStatus;

  @ApiProperty({ example: '664f1b2c2f8b2c0012a4e123', required: false })
  @IsString()
  @IsOptional()
  residentId?: string;
} 