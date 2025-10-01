import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonthlyBillingController } from './monthly-billing.controller';
import { MonthlyBillingService } from './monthly-billing.service';

@Module({
  imports: [],
  controllers: [MonthlyBillingController],
  providers: [MonthlyBillingService],
  exports: [MonthlyBillingService],
})
export class MonthlyBillingModule {}
