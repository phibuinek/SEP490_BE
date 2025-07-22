import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema } from './schemas/room.schema';
import { BedAssignmentsModule } from '../bed-assignments/bed-assignments.module';
import { Bed, BedSchema } from '../beds/schemas/bed.schema';
import {
  BedAssignment,
  BedAssignmentSchema,
} from '../bed-assignments/schemas/bed-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Bed.name, schema: BedSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
    forwardRef(() => BedAssignmentsModule),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
