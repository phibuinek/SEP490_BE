import { PartialType } from '@nestjs/swagger';
import { CreateCarePlanAssignmentDto } from './create-care-plan-assignment.dto';

export class UpdateCarePlanAssignmentDto extends PartialType(
  CreateCarePlanAssignmentDto,
) {} 