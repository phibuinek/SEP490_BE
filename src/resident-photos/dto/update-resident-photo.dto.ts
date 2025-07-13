import { IsString, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateResidentPhotoDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  activityType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]))
  tags?: string[];

  @IsOptional()
  @IsString()
  takenDate?: string;

  @IsOptional()
  @IsString()
  staffNotes?: string;

  @IsOptional()
  @IsString()
  relatedActivityId?: string;

  @IsOptional()
  @IsString()
  serviceStartDate?: string;

  @IsOptional()
  @IsString()
  residentId?: string;
} 