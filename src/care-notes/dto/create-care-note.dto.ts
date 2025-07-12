import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCareNoteDto {
  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  residentId: string;
} 