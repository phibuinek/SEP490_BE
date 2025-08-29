import { PartialType } from '@nestjs/swagger';
import { CreateResidentDto } from './create-resident.dto';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateResidentDto extends PartialType(CreateResidentDto) {
  @IsOptional()
  @IsDateString()
  discharge_date?: string | null;

  // Allow camelCase from clients if sent
  @IsOptional()
  @IsDateString()
  dischargeDate?: string | null;
}
