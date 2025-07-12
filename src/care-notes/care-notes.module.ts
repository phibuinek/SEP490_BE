import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CareNote, CareNoteSchema } from './schemas/care-note.schema';
import { CareNotesService } from './care-notes.service';
import { CareNotesController } from './care-notes.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CareNote.name, schema: CareNoteSchema }]),
  ],
  controllers: [CareNotesController],
  providers: [CareNotesService],
  exports: [CareNotesService],
})
export class CareNotesModule {} 