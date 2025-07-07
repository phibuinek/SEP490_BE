import { PartialType } from '@nestjs/swagger';
import { CreateResidentDto } from './create-resident.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateResidentDto extends PartialType(CreateResidentDto) {
  @IsOptional()
  @IsString()
  carePlanId?: string;
} 