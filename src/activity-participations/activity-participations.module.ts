import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityParticipationsController } from './activity-participations.controller';
import { ActivityParticipationsService } from './activity-participations.service';
import {
  ActivityParticipation,
  ActivityParticipationSchema,
} from './schemas/activity-participation.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Activity, ActivitySchema } from '../activity/schemas/activity.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityParticipation.name, schema: ActivityParticipationSchema },
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Resident.name, schema: ResidentSchema },
    ]),
  ],
  controllers: [ActivityParticipationsController],
  providers: [ActivityParticipationsService],
})
export class ActivityParticipationsModule {}
