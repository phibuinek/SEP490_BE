import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResidentsController } from './residents.controller';
import { ResidentsService } from './residents.service';
import { Resident, ResidentSchema } from './schemas/resident.schema';
import { UsersModule } from '../users/users.module';
import { BedsModule } from '../beds/beds.module';
import { Bed, BedSchema } from '../beds/schemas/bed.schema';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resident.name, schema: ResidentSchema },
      { name: Bed.name, schema: BedSchema },
    ]),
    UsersModule,
    BedsModule,
    RoomsModule,
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [
    ResidentsService,
    MongooseModule.forFeature([
      { name: Resident.name, schema: ResidentSchema },
    ]),
  ],
})
export class ResidentsModule {}
