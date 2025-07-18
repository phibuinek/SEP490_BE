import { IsString, IsOptional, IsArray, IsMongoId, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateResidentPhotoDto {
  @IsMongoId()
  resident_id: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  activity_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value],
  )
  tags?: string[];

  @IsOptional()
  @IsDateString()
  taken_date?: string;

  @IsOptional()
  @IsString()
  staff_notes?: string;

  @IsOptional()
  @IsMongoId()
  related_activity_id?: string;
}
