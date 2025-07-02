import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bed, BedSchema } from './schemas/bed.schema';
import { BedsController } from './beds.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bed.name, schema: BedSchema }])],
  controllers: [BedsController],
  exports: [MongooseModule],
})
export class BedsModule {} 