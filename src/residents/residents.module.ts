import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { Resident, ResidentSchema } from './schemas/resident.schema';
import { UsersModule } from '../users/users.module';
import { BedsModule } from '../beds/beds.module';
import { Bed, BedSchema } from '../beds/schemas/bed.schema';
import { RoomsModule } from '../rooms/rooms.module';
import { CacheService } from '../common/cache.service';
import { ResidentsSchedulerService } from './residents.scheduler';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resident.name, schema: ResidentSchema },
      { name: Bed.name, schema: BedSchema },
    ]),
    UsersModule,
    ScheduleModule,
    BedsModule,
    RoomsModule,
    CommonModule,
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService, CacheService, ResidentsSchedulerService],
  exports: [
    ResidentsService,
    MongooseModule.forFeature([
      { name: Resident.name, schema: ResidentSchema },
    ]),
  ],
})
export class ResidentsModule {}
