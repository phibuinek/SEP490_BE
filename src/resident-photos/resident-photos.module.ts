import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResidentPhoto, ResidentPhotoSchema } from './resident-photo.schema';
import { ResidentPhotosService } from './resident-photos.service';
import { ResidentPhotosController } from './resident-photos.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ResidentPhoto.name, schema: ResidentPhotoSchema }])],
  controllers: [ResidentPhotosController],
  providers: [ResidentPhotosService],
  exports: [ResidentPhotosService],
})
export class ResidentPhotosModule {} 