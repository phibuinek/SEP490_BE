import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { MonthlyBillingService } from './monthly-billing.service';
import { MonthlyBillingController } from './monthly-billing.controller';
import { Bill, BillSchema } from '../bills/schemas/bill.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CarePlanAssignment, CarePlanAssignmentSchema } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentSchema } from '../bed-assignments/schemas/bed-assignment.schema';
import { BillsModule } from '../bills/bills.module';
import { MailService } from '../common/mail.service';

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
  ],
  controllers: [MonthlyBillingController],
  providers: [MonthlyBillingService, MailService],
  exports: [MonthlyBillingService],
})
export class MonthlyBillingModule {}
