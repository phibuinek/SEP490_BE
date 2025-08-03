import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenewAssignmentDto {
  @ApiProperty({
    description: 'New end date for the care plan assignment',
    example: '2024-12-31',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  newEndDate: string;
} 