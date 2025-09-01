import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VitalSign, VitalSignSchema } from './schemas/vital-sign.schema';
import { VitalSignsService } from './vital-signs.service';
import { VitalSignsController } from './vital-signs.controller';
import { ResidentsModule } from '../residents/residents.module';
import {
  StaffAssignment,
  StaffAssignmentSchema,
} from '../staff-assignments/schemas/staff-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VitalSign.name, schema: VitalSignSchema },
      { name: StaffAssignment.name, schema: StaffAssignmentSchema },
    ]),
    ResidentsModule,
  ],
  controllers: [VitalSignsController],
  providers: [VitalSignsService],
  exports: [MongooseModule],
})
export class VitalSignsModule {}
