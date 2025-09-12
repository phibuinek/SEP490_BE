import { IsMongoId, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBedAssignmentDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', type: String })
  @IsMongoId()
  resident_id: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c86', type: String })
  @IsMongoId()
  bed_id: string;

  @ApiPropertyOptional({ example: '60d21b4667d0d8992e610c87', type: String })
  @IsOptional()
  @IsMongoId()
  assigned_by?: string;

  @ApiPropertyOptional({
    enum: ['active', 'accepted', 'pending', 'rejected', 'discharged', 'exchanged'],
    description: 'Trạng thái phân giường',
    default: 'pending',
  })
  @IsOptional()
  @IsEnum(['active', 'accepted', 'pending', 'rejected', 'discharged', 'exchanged'])
  status?: string;
}
