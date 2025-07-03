import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ResidentsModule } from './residents/residents.module';
import { VitalSignsModule } from './vital-signs/vital-signs.module';
import { CarePlanModule } from './care-plan/care-plan.module';
import { ActivityModule } from './activity/activity.module';
import { ActivityParticipationsModule } from './activity-participations/activity-participations.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nhms_db'),
    UsersModule,
    AuthModule,
    ResidentsModule,
    VitalSignsModule,
    CarePlanModule,
    ActivityModule,
    ActivityParticipationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
