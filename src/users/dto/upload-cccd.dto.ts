import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import type { Express } from 'express';

export class UploadCccdDto {
  @ApiProperty({
    example: '123456789012',
    description: 'CCCD ID (12 digits)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{12}$/, { message: 'CCCD ID must be exactly 12 digits' })
  cccd_id: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'CCCD front image (optional)',
  })
  @IsOptional()
  cccd_front?: Express.Multer.File;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'CCCD back image (optional)',
  })
  @IsOptional()
  cccd_back?: Express.Multer.File;
}
