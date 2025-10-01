import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsDateString } from 'class-validator';

export class ServiceDateChangeRequestDto {
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
    description: 'Current care plan assignment ID to extend',
    example: '507f1f77bcf86cd799439015'
  })
  @IsMongoId()
  current_care_plan_assignment_id: string;

  @ApiProperty({ 
    description: 'New end date for service extension (ISO string)',
    example: '2024-12-31T23:59:59.000Z'
  })
  @IsDateString()
  new_end_date: string;

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
