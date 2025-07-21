import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { Bill, BillSchema } from './schemas/bill.schema';
import { CarePlansModule } from '../care-plans/care-plans.module';
import { ResidentsModule } from '../residents/residents.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bill.name, schema: BillSchema }]),
    CarePlansModule,
    ResidentsModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}
