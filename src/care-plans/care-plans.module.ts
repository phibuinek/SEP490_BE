import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarePlansService } from './care-plans.service';
import { CarePlansController } from './care-plans.controller';
import { CarePlan, CarePlanSchema } from './schemas/care-plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CarePlan.name, schema: CarePlanSchema }]),
  ],
  controllers: [CarePlansController],
  providers: [CarePlansService],
  exports: [CarePlansService],
})
export class CarePlansModule {} 