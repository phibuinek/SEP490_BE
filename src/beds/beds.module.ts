import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bed, BedSchema } from './schemas/bed.schema';
import { BedsController } from './beds.controller';
import { BedsService } from './beds.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bed.name, schema: BedSchema }])],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [MongooseModule, BedsService],
})
export class BedsModule {} 