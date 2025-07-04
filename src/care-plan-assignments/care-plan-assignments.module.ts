import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarePlanAssignmentsService } from './care-plan-assignments.service';
import { CarePlanAssignmentsController } from './care-plan-assignments.controller';
import {
  CarePlanAssignment,
  CarePlanAssignmentSchema,
} from './schemas/care-plan-assignment.schema';
import { BillsModule } from '../bills/bills.module';
import { CarePlan, CarePlanSchema } from '../care-plan/schemas/care-plan.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: CarePlan.name, schema: CarePlanSchema },
      { name: Resident.name, schema: ResidentSchema },
    ]),
    BillsModule,
  ],
  controllers: [CarePlanAssignmentsController],
  providers: [CarePlanAssignmentsService],
})
export class CarePlanAssignmentsModule {} 