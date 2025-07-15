import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarePlansService } from './care-plans.service';
import { CarePlansController } from './care-plans.controller';
import { CarePlan, CarePlanSchema } from './schemas/care-plan.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarePlan.name, schema: CarePlanSchema },
      { name: Resident.name, schema: ResidentSchema },
    ]),
  ],
  controllers: [CarePlansController],
  providers: [CarePlansService],
  exports: [CarePlansService],
})
export class CarePlansModule {}
