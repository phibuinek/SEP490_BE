import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarePlan, CarePlanSchema } from './schemas/care-plan.schema';
import { CarePlanService } from './care-plan.service';
import { CarePlanController } from './care-plan.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: CarePlan.name, schema: CarePlanSchema }])],
  controllers: [CarePlanController],
  providers: [CarePlanService],
  exports: [MongooseModule],
})
export class CarePlanModule {} 