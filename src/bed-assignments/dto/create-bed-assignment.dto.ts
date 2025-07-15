import { IsMongoId, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBedAssignmentDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', type: String })
  @IsMongoId()
  resident_id: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c86', type: String })
  @IsMongoId()
  bed_id: string;

  @ApiProperty({ example: '2024-07-14T10:00:00.000Z', type: String })
  @IsDateString()
  assigned_date: string;

  @ApiPropertyOptional({
    example: '2024-07-15T10:00:00.000Z',
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  unassigned_date?: string | null;

  @ApiPropertyOptional({ example: '60d21b4667d0d8992e610c87', type: String })
  @IsOptional()
  @IsMongoId()
  assigned_by?: string;
}
