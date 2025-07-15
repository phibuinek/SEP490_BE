import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignCarePlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  carePlanId: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  residentId: string;
}
