import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { BillsModule } from '../bills/bills.module';
import { CarePlansModule } from '../care-plans/care-plans.module';
import { Bill, BillSchema } from '../bills/schemas/bill.schema';
import { CarePlanAssignment, CarePlanAssignmentSchema } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentSchema } from '../bed-assignments/schemas/bed-assignment.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Bill.name, schema: BillSchema },
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
      { name: Resident.name, schema: ResidentSchema },
    ]),
    BillsModule,
    CarePlansModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
