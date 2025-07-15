import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Assessment, AssessmentSchema } from './schemas/care-note.schema';
import { CareNotesService } from './care-notes.service';
import { AssessmentsController } from './care-notes.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assessment.name, schema: AssessmentSchema },
    ]),
  ],
  controllers: [AssessmentsController],
  providers: [CareNotesService],
  exports: [CareNotesService],
})
export class CareNotesModule {}
