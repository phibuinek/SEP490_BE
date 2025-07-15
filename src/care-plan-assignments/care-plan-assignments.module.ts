import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarePlanAssignmentsService } from './care-plan-assignments.service';
import { CarePlanAssignmentsController } from './care-plan-assignments.controller';
import {
  CarePlanAssignment,
  CarePlanAssignmentSchema,
} from './schemas/care-plan-assignment.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: Resident.name, schema: ResidentSchema },
    ]),
  ],
  controllers: [CarePlanAssignmentsController],
  providers: [CarePlanAssignmentsService],
  exports: [CarePlanAssignmentsService],
})
export class CarePlanAssignmentsModule {}
