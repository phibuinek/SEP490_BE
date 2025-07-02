import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { Resident, ResidentSchema } from './schemas/resident.schema';
import { UsersModule } from '../users/users.module';
import { BedsModule } from '../beds/beds.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Resident.name, schema: ResidentSchema }]),
    UsersModule,
    BedsModule,
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
})
export class ResidentsModule {}
