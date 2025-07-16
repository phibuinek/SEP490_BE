import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignCarePlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  care_plan_id: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resident_id: string;
}
