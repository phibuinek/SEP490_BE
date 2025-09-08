import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarePlanAssignmentsService } from './care-plan-assignments.service';
import { CarePlanAssignmentsController } from './care-plan-assignments.controller';
import { CarePlanAssignmentsSchedulerService } from './care-plan-assignments-scheduler.service';
import {
  CarePlanAssignment,
  CarePlanAssignmentSchema,
} from './schemas/care-plan-assignment.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import { CarePlan, CarePlanSchema } from '../care-plans/schemas/care-plan.schema';
import { BillsModule } from '../bills/bills.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: Resident.name, schema: ResidentSchema },
      { name: CarePlan.name, schema: CarePlanSchema },
    ]),
    forwardRef(() => BillsModule),
  ],
  controllers: [CarePlanAssignmentsController],
  providers: [CarePlanAssignmentsService, CarePlanAssignmentsSchedulerService],
  exports: [CarePlanAssignmentsService],
})
export class CarePlanAssignmentsModule {}
