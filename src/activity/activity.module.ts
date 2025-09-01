import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import {
  ActivityParticipation,
  ActivityParticipationSchema,
} from '../activity-participations/schemas/activity-participation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: Resident.name, schema: ResidentSchema },
      { name: ActivityParticipation.name, schema: ActivityParticipationSchema },
    ]),
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
