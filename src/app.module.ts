import * as fs from 'fs';
import * as path from 'path';

// Load .env file manually
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 .env file content:');
    console.log('---START---');
    console.log(envContent);
    console.log('---END---');
    console.log('📏 File length:', envContent.length);
    
    envContent.split('\n').forEach(line => {
      console.log('🔍 Processing line:', JSON.stringify(line));
      const [key, ...valueParts] = line.trim().split('=');
      if (key && valueParts.length > 0) {
        console.log(`✅ Setting ${key}=${valueParts.join('=')}`);
        process.env[key] = valueParts.join('=');
      }
    });
    console.log('✅ .env file loaded successfully');
    console.log('📌 MONGODB_URI exists:', process.env.MONGODB_URI ? 'YES' : 'NO');
    if (process.env.MONGODB_URI) {
      console.log('🔗 MONGODB_URI value:', process.env.MONGODB_URI.substring(0, 50) + '...');
    }
  } else {
    console.log('❌ .env file not found at:', envPath);
  }
} catch (error) {
  console.log('❌ Error loading .env file:', error.message);
}

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
// import { DatabaseModule } from './database/database.module'; // Tắt seeder tự động
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
    (() => {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is required for MongoDB Atlas connection!');
      }
      return MongooseModule.forRoot(process.env.MONGODB_URI);
    })(),
    // DatabaseModule, // Tắt seeder tự động vì dữ liệu Atlas đã có
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
