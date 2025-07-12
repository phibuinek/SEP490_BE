import { IsString, IsOptional } from 'class-validator';

export class UpdateCareNoteDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  content?: string;
} 