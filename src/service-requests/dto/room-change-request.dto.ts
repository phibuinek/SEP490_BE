import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId } from 'class-validator';

export class RoomChangeRequestDto {
  @ApiProperty({ 
    description: 'Resident ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  resident_id: string;

  @ApiProperty({ 
    description: 'Family member ID',
    example: '507f1f77bcf86cd799439012'
  })
  @IsMongoId()
  family_member_id: string;

  @ApiProperty({ 
    description: 'Reason for changing room',
    example: 'Cần chuyển phòng do vấn đề về tiếng ồn'
  })
  @IsString()
  note: string;

  @ApiProperty({ 
    description: 'Target bed assignment ID (created by user)',
    example: '507f1f77bcf86cd799439014'
  })
  @IsMongoId()
  target_bed_assignment_id: string;

  @ApiProperty({ 
    description: 'Emergency contact name',
    example: 'Nguyễn Văn A'
  })
  @IsString()
  emergencyContactName: string;

  @ApiProperty({ 
    description: 'Emergency contact phone number',
    example: '0901234567'
  })
  @IsString()
  emergencyContactPhone: string;

  @ApiProperty({ 
    description: 'Medical notes about the resident',
    example: 'Cư dân cần chăm sóc đặc biệt do bệnh tim',
    required: false 
  })
  @IsString()
  medicalNote?: string;
}
