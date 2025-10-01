import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceRequest, ServiceRequestSchema } from './schemas/service-request.schema';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import { CarePlanAssignment, CarePlanAssignmentSchema } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentSchema } from '../bed-assignments/schemas/bed-assignment.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { Bed, BedSchema } from '../beds/schemas/bed.schema';
import { CarePlan, CarePlanSchema } from '../care-plans/schemas/care-plan.schema';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: Resident.name, schema: ResidentSchema },
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Bed.name, schema: BedSchema },
      { name: CarePlan.name, schema: CarePlanSchema },
    ]),
    CommonModule,
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
