import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BedAssignment, BedAssignmentSchema } from './schemas/bed-assignment.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: BedAssignment.name, schema: BedAssignmentSchema }])],
  exports: [MongooseModule],
})
export class BedAssignmentsModule {} 