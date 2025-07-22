import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BedAssignment,
  BedAssignmentSchema,
} from './schemas/bed-assignment.schema';
import { BedAssignmentsController } from './bed-assignments.controller';
import { BedAssignmentsService } from './bed-assignments.service';
import { BedsModule } from '../beds/beds.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
    BedsModule,
    forwardRef(() => RoomsModule),
  ],
  controllers: [BedAssignmentsController],
  providers: [BedAssignmentsService],
  exports: [MongooseModule],
})
export class BedAssignmentsModule {}
