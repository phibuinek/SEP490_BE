import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AddImageDto } from './dto/add-image.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity (Staff only)' })
  create(@Body() dto: CreateActivityDto, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities (Staff only)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an activity by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('resident/:residentId')
  @ApiOperation({ summary: 'Get activities by resident ID (Family can view their relative\'s activities)' })
  findByResident(@Param('residentId') residentId: string) {
    return this.service.findByResident(residentId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an activity (Staff only)' })
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto, @Request() req) {
    return this.service.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity (Staff only)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Add image to activity (Staff only)' })
  addImage(@Param('id') id: string, @Body() imageDto: AddImageDto, @Request() req) {
    return this.service.addImage(id, imageDto, req.user.userId);
  }

  @Delete(':id/images/:imageIndex')
  @ApiOperation({ summary: 'Remove image from activity (Staff only)' })
  removeImage(@Param('id') id: string, @Param('imageIndex') imageIndex: string) {
    return this.service.removeImage(id, parseInt(imageIndex));
  }
} 