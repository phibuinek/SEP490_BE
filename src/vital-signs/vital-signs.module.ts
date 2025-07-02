import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VitalSign, VitalSignSchema } from './schemas/vital-sign.schema';
import { VitalSignsService } from './vital-signs.service';
import { VitalSignsController } from './vital-signs.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: VitalSign.name, schema: VitalSignSchema }])],
  controllers: [VitalSignsController],
  providers: [VitalSignsService],
  exports: [MongooseModule],
})
export class VitalSignsModule {} 