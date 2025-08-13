import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityRecommendationDto } from './dto/activity-recommendation.dto';

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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.service.update(id, updateActivityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity template' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('recommendation/ai')
  @ApiBody({ type: ActivityRecommendationDto })
  async recommendActivityAI(@Body() body: ActivityRecommendationDto) {
    console.log('Controller received body:', body);
    console.log('Controller received resident_ids:', body.resident_ids);
    console.log('Controller received schedule_time:', body.schedule_time);
    
    try {
      return await this.service.recommendActivityAI(
        body.resident_ids, 
        body.schedule_time
      );
    } catch (error) {
      console.error('Error in recommendActivityAI controller:', error);
      throw error;
    }
  }

  @Post('check-schedule-conflict')
  @ApiOperation({ summary: 'Check schedule conflict for a resident' })
  async checkScheduleConflict(
    @Body() body: { residentId: string; scheduleTime: string; duration: number }
  ) {
    try {
      await this.service.checkScheduleConflictWithResident(
        body.residentId,
        new Date(body.scheduleTime),
        body.duration
      );
      return { hasConflict: false, message: 'Không có trùng lịch' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { hasConflict: true, message: error.message };
      }
      throw error;
    }
  }
}
