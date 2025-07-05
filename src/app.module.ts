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
// import { CarePlanAssignmentsModule } from './care-plan-assignments/care-plan-assignments.module';
import { DatabaseModule } from './database/database.module';
import { CarePlansModule } from './care-plans/care-plans.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nhms_db'),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ResidentsModule,
    BedsModule,
    VitalSignsModule,
    PaymentModule,
    BillsModule,
    // CarePlanAssignmentsModule,
    CarePlansModule,
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
