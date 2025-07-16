import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BedAssignment,
  BedAssignmentSchema,
} from './schemas/bed-assignment.schema';
import { BedAssignmentsController } from './bed-assignments.controller';
import { BedAssignmentsService } from './bed-assignments.service';
import { ResidentsModule } from '../residents/residents.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
    forwardRef(() => ResidentsModule),
  ],
  controllers: [BedAssignmentsController],
  providers: [BedAssignmentsService],
  exports: [MongooseModule],
})
export class BedAssignmentsModule {}
