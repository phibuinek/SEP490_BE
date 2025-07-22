import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentDto } from './create-care-note.dto';

export class UpdateCareNoteDto extends PartialType(CreateAssessmentDto) {}
