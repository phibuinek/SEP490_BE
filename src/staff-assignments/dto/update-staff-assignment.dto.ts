import { PartialType } from '@nestjs/swagger';
import { CreateStaffAssignmentDto } from './create-staff-assignment.dto';

export class UpdateStaffAssignmentDto extends PartialType(
  CreateStaffAssignmentDto,
) {}
