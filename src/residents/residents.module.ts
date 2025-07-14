import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { Resident, ResidentSchema } from './schemas/resident.schema';
import { UsersModule } from '../users/users.module';
import { BedsModule } from '../beds/beds.module';
import { Bed, BedSchema } from '../beds/schemas/bed.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resident.name, schema: ResidentSchema },
      { name: Bed.name, schema: BedSchema },
    ]),
    UsersModule,
    BedsModule,
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService],
})
export class ResidentsModule {}
