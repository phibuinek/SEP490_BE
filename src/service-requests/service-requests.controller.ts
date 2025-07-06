import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@ApiBearerAuth()
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Post()
  create(@Body() dto: CreateServiceRequestDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
} 