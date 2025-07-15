import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BedAssignment,
  BedAssignmentSchema,
} from './schemas/bed-assignment.schema';
import { BedAssignmentsController } from './bed-assignments.controller';
import { BedAssignmentsService } from './bed-assignments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
  ],
  controllers: [BedAssignmentsController],
  providers: [BedAssignmentsService],
  exports: [MongooseModule],
})
export class BedAssignmentsModule {}
