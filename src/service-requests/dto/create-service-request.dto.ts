import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsString()
  resident_id: string;

  @ApiProperty()
  @IsString()
  familyMemberId: string;

  @ApiProperty()
  @IsString()
  servicePackageId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  emergencyContactName: string;

  @ApiProperty()
  @IsString()
  emergencyContactPhone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medicalNote?: string;
}
