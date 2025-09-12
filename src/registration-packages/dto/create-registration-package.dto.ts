import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

export class CreateRegistrationPackageDto {
  @ApiProperty({ description: 'ID của resident' })
  @IsMongoId()
  @IsNotEmpty()
  resident_id: string;

  @ApiProperty({ description: 'ID của care plan assignment' })
  @IsMongoId()
  @IsNotEmpty()
  care_plan_assignment_id: string;

  @ApiProperty({ description: 'ID của bed assignment' })
  @IsMongoId()
  @IsNotEmpty()
  bed_assignment_id: string;
}
