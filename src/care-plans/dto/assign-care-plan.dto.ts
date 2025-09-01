import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class AssignCarePlanDto {
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  care_plan_id: string;
  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  resident_id: string;
}
