import { IsString, IsOptional, IsArray , IsMongoId} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateResidentPhotoDto {
  @IsMongoId()
  family_id: string;

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
  @IsString()
  taken_date?: string;

  @IsOptional()
  @IsString()
  staff_notes?: string;

  @IsOptional()
  @IsString()
  related_activity_id?: string;

  @IsOptional()
  @IsString()
  service_start_date?: string;

  @IsOptional()
  @IsString()
  resident_id?: string;
}
