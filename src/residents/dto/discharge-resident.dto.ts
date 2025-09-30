import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ResidentStatus } from '../schemas/resident.schema';

export class DischargeResidentDto {
  @ApiProperty({
    enum: [ResidentStatus.DISCHARGED, ResidentStatus.DECEASED],
    description: 'Discharge status - either discharged or deceased',
    example: 'discharged'
  })
  @IsEnum([ResidentStatus.DISCHARGED, ResidentStatus.DECEASED])
  @IsNotEmpty()
  status: ResidentStatus.DISCHARGED | ResidentStatus.DECEASED;

  @ApiProperty({
    description: 'Reason for discharge (required)',
    example: 'Resident completed treatment and is ready to go home'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
