import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { MonthlyBillingController } from './monthly-billing.controller';
import { MonthlyBillingService } from './monthly-billing.service';
import { Bill, BillSchema } from '../bills/schemas/bill.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CarePlanAssignment, CarePlanAssignmentSchema } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentSchema } from '../bed-assignments/schemas/bed-assignment.schema';
import { BillsModule } from '../bills/bills.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Bill.name, schema: BillSchema },
      { name: Resident.name, schema: ResidentSchema },
      { name: User.name, schema: UserSchema },
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
    BillsModule,
    CommonModule,
  ],
  controllers: [MonthlyBillingController],
  providers: [MonthlyBillingService],
  exports: [MonthlyBillingService],
})
export class MonthlyBillingModule {}
