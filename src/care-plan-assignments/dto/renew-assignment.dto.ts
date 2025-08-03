import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewAssignmentDto {
  @ApiProperty({
    description: 'New start date for the care plan assignment (optional, defaults to current date)',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  newStartDate?: string;

  @ApiProperty({
    description: 'New end date for the care plan assignment',
    example: '2024-12-31',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  newEndDate: string;
} 