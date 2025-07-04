import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ActivityParticipation,
  ActivityParticipationSchema,
} from './schemas/activity-participation.schema';
import { ActivityParticipationsService } from './activity-participations.service';
import { ActivityParticipationsController } from './activity-participations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityParticipation.name, schema: ActivityParticipationSchema },
    ]),
  ],
  controllers: [ActivityParticipationsController],
  providers: [ActivityParticipationsService],
})
export class ActivityParticipationsModule {} 