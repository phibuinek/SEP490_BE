import { PartialType } from '@nestjs/swagger';
import { CreateCarePlanDto } from './create-care-plan.dto';

export class UpdateCarePlanDto extends PartialType(CreateCarePlanDto) {} 