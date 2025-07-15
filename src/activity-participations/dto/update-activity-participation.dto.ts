import { PartialType } from '@nestjs/swagger';
import { CreateActivityParticipationDto } from './create-activity-participation.dto';

export class UpdateActivityParticipationDto extends PartialType(
  CreateActivityParticipationDto,
) {}
