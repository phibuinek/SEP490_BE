import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity template' })
  create(@Body() dto: CreateActivityDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activity templates' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an activity template by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity template' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
} 