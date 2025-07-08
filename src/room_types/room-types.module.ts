import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomTypesService } from './room-types.service';
import { RoomTypesController } from './room-types.controller';
import { RoomType, RoomTypeSchema } from './schemas/room-type.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: RoomType.name, schema: RoomTypeSchema }])],
  controllers: [RoomTypesController],
  providers: [RoomTypesService],
  exports: [RoomTypesService],
})
export class RoomTypesModule {} 