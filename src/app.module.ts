import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ResidentsModule } from './residents/residents.module';
import { BedsModule } from './beds/beds.module';
import { VitalSignsModule } from './vital-signs/vital-signs.module';
import { PaymentModule } from './payment/payment.module';
import { BillsModule } from './bills/bills.module';
import { CarePlanAssignmentsModule } from './care-plan-assignments/care-plan-assignments.module';
import { DatabaseModule } from './database/database.module';
import { CarePlansModule } from './care-plans/care-plans.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { FinanceModule } from './finance/finance.module';
import { ResidentPhotosModule } from './resident-photos/resident-photos.module';
import { VisitsModule } from './visits/visits.module';
import { ActivityModule } from './activity/activity.module';
import { ActivityParticipationsModule } from './activity-participations/activity-participations.module';
import { RoomTypesModule } from './room_types/room-types.module';
import { CareNotesModule } from './care-notes/care-notes.module';
import { RoomsModule } from './rooms/rooms.module';
import { BedAssignmentsModule } from './bed-assignments/bed-assignments.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nhms_db',
    ),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ResidentsModule,
    BedsModule,
    VitalSignsModule,
    PaymentModule,
    BillsModule,
    CarePlanAssignmentsModule,
    CarePlansModule,
    ServiceRequestsModule,
    FinanceModule,
    ResidentPhotosModule,
    VisitsModule,
    ActivityModule,
    ActivityParticipationsModule,
    RoomTypesModule,
    CareNotesModule,
    RoomsModule,
    BedAssignmentsModule,
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
