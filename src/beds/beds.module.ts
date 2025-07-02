import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bed, BedSchema } from './schemas/bed.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bed.name, schema: BedSchema }])],
  exports: [MongooseModule],
})
export class BedsModule {} 