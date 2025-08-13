import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { Bill, BillSchema } from './schemas/bill.schema';
import { CarePlansModule } from '../care-plans/care-plans.module';
import { ResidentsModule } from '../residents/residents.module';
import { CarePlanAssignmentsModule } from '../care-plan-assignments/care-plan-assignments.module';
import { BedAssignmentsModule } from '../bed-assignments/bed-assignments.module';
import { RoomTypesModule } from '../room_types/room-types.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bill.name, schema: BillSchema }]),
    CarePlansModule,
    ResidentsModule,
    CarePlanAssignmentsModule,
    BedAssignmentsModule,
    RoomTypesModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
