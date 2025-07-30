import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Assessment, AssessmentSchema } from './schemas/care-note.schema';
import { CareNotesService } from './care-notes.service';
import { AssessmentsController } from './care-notes.controller';
import { StaffAssignment, StaffAssignmentSchema } from '../staff-assignments/schemas/staff-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assessment.name, schema: AssessmentSchema },
      { name: StaffAssignment.name, schema: StaffAssignmentSchema },
    ]),
  ],
  controllers: [AssessmentsController],
  providers: [CareNotesService],
  exports: [CareNotesService],
})
export class CareNotesModule {}
