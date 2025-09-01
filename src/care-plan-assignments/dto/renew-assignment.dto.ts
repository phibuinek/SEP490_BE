import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewAssignmentDto {
  @ApiProperty({
    description:
      'New start date for the care plan assignment (optional, defaults to current date)',
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

  @ApiProperty({
    description:
      'Array of care plan IDs to renew (optional, if not provided, all care plans will be renewed)',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedCarePlanIds?: string[];
}
