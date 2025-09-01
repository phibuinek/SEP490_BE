import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BedsService } from './beds.service';
import { BedsController } from './beds.controller';
import { Bed, BedSchema } from './schemas/bed.schema';
import {
  BedAssignment,
  BedAssignmentSchema,
} from '../bed-assignments/schemas/bed-assignment.schema';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bed.name, schema: BedSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
    RoomsModule,
  ],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
