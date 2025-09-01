import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsMongoId()
  resident_id: string;

  @ApiProperty()
  @IsMongoId()
  familyMemberId: string;

  @ApiProperty()
  @IsMongoId()
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
