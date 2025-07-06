import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceRequest, ServiceRequestSchema } from './service-request.schema';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ServiceRequest.name, schema: ServiceRequestSchema }])],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {} 