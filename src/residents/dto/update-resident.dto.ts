import { PartialType } from '@nestjs/swagger';
import { CreateResidentDto } from './create-resident.dto';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateResidentDto extends PartialType(CreateResidentDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  carePlanIds?: string[];
} 