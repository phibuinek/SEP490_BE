import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BedsService } from './beds.service';
import { BedsController } from './beds.controller';
import { Bed, BedSchema } from './schemas/bed.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bed.name, schema: BedSchema }])],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {} 