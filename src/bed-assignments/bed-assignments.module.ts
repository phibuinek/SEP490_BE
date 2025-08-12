import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BedAssignment,
  BedAssignmentSchema,
} from './schemas/bed-assignment.schema';
import { BedAssignmentsController } from './bed-assignments.controller';
import { BedAssignmentsService } from './bed-assignments.service';
import { ResidentsModule } from '../residents/residents.module';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { Bed, BedSchema } from '../beds/schemas/bed.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BedAssignment.name, schema: BedAssignmentSchema },
      { name: Bed.name, schema: BedSchema },
      { name: Room.name, schema: RoomSchema },
    ]),
    forwardRef(() => ResidentsModule),
  ],
  controllers: [BedAssignmentsController],
  providers: [BedAssignmentsService],
  exports: [MongooseModule, BedAssignmentsService],
})
export class BedAssignmentsModule {}
