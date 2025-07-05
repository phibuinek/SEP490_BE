import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { BillsModule } from '../bills/bills.module';
import { CarePlansModule } from '../care-plans/care-plans.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    BillsModule,
    CarePlansModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {} 