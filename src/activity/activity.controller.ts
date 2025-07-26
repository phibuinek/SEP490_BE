import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
    console.log('Controller received timesOfDay:', body.timesOfDay);
    
    try {
      return await this.service.recommendActivityAI(body.resident_ids, body.timesOfDay);
    } catch (error) {
      console.error('Error in recommendActivityAI controller:', error);
      throw error;
    }
  }

  @Post('test-recommendation')
  @ApiOperation({ summary: 'Test endpoint for recommendation' })
  async testRecommendation(@Body() body: any) {
    console.log('Test endpoint received body:', body);
    console.log('Test endpoint received resident_ids:', body.resident_ids);
    console.log('Test endpoint received timesOfDay:', body.timesOfDay);
    console.log('Type of resident_ids:', typeof body.resident_ids);
    console.log('Is Array?', Array.isArray(body.resident_ids));
    
    return {
      message: 'Test successful',
      receivedData: body,
      resident_ids_type: typeof body.resident_ids,
      is_array: Array.isArray(body.resident_ids)
    };
  }
}
