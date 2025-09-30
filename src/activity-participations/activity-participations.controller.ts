import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ActivityParticipationsService } from './activity-participations.service';
import { CreateActivityParticipationDto } from './dto/create-activity-participation.dto';
import { UpdateActivityParticipationDto } from './dto/update-activity-participation.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';

@ApiTags('Activity Participations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity-participations')
export class ActivityParticipationsController {
  constructor(private readonly service: ActivityParticipationsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new activity participation' })
  create(@Body() createDto: CreateActivityParticipationDto, @Req() req: any) {
    return this.service.create(createDto, req);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activity participation records' })
  async findAll() {
    console.log('[findAll] Called');
    try {
      const result = await this.service.findAll();
      console.log('[findAll] result count:', result.length);
      return result;
    } catch (err) {
      console.error('[findAll] Error:', err.message);
      console.error(err.stack);
      throw err;
    }
  }

  @Get('by-resident')
  @ApiOperation({ summary: 'Get all activity participations by residentId' })
  async getByResident(@Query('resident_id') resident_id: string) {
    console.log('[by-resident] resident_id:', resident_id);
    try {
      // Chuyển đổi resident_id sang ObjectId nếu hợp lệ
      if (!Types.ObjectId.isValid(resident_id)) {
        console.error('[by-resident] Invalid resident_id format:', resident_id);
        throw new BadRequestException('Invalid resident_id format');
      }
      const result = await this.service.findByResidentId(resident_id);
      console.log('[by-resident] result count:', result.length);
      return result;
    } catch (err) {
      console.error('[by-resident] Error:', err.message);
      console.error(err.stack);
      throw err;
    }
  }

  @Get('by-staff/:staffId')
  @ApiOperation({ summary: 'Get all activity participations by staffId' })
  async getParticipationsByStaffId(@Param('staffId') staffId: string) {
    return this.service.findByStaffId(staffId);
  }

  @Get('stats/by-staff/:staffId')
  @ApiOperation({ summary: 'Get count of distinct activities handled by a staff' })
  async getDistinctActivityCountByStaff(@Param('staffId') staffId: string) {
    return this.service.countDistinctActivitiesByStaff(staffId);
  }

  @Get('stats/all-staff')
  @ApiOperation({ summary: 'Get distinct activity counts for all staff, sorted ascending' })
  async getDistinctActivityCountsForAllStaff() {
    return this.service.countDistinctActivitiesForAllStaff();
  }

  @Get('by-activity')
  @ApiOperation({
    summary: 'Get all activity participations by activityId and date',
  })
  async getByActivity(
    @Query('activity_id') activity_id: string,
    @Query('date') date?: string,
  ) {
    console.log('[by-activity] activity_id:', activity_id, 'date:', date);
    try {
      // Chuyển đổi activity_id sang ObjectId nếu hợp lệ
      if (!Types.ObjectId.isValid(activity_id)) {
        console.error('[by-activity] Invalid activity_id format:', activity_id);
        throw new BadRequestException('Invalid activity_id format');
      }
      const result = await this.service.findByActivityId(activity_id, date);
      console.log('[by-activity] result count:', result.length);
      return result;
    } catch (err) {
      console.error('[by-activity] Error:', err.message);
      console.error(err.stack);
      throw err;
    }
  }

  @Get('by-resident-activity')
  @ApiOperation({
    summary: 'Get activity participation by residentId and activityId',
  })
  async getByResidentAndActivity(
    @Query('resident_id') resident_id: string,
    @Query('activity_id') activity_id: string,
  ) {
    console.log(
      '[by-resident-activity] resident_id:',
      resident_id,
      'activity_id:',
      activity_id,
    );
    try {
      // Chuyển đổi IDs sang ObjectId nếu hợp lệ
      if (!Types.ObjectId.isValid(resident_id)) {
        console.error(
          '[by-resident-activity] Invalid resident_id format:',
          resident_id,
        );
        throw new BadRequestException('Invalid resident_id format');
      }
      if (!Types.ObjectId.isValid(activity_id)) {
        console.error(
          '[by-resident-activity] Invalid activity_id format:',
          activity_id,
        );
        throw new BadRequestException('Invalid activity_id format');
      }
      const result = await this.service.findByResidentAndActivity(
        resident_id,
        activity_id,
      );
      console.log('[by-resident-activity] result:', result);
      return result;
    } catch (err) {
      console.error('[by-resident-activity] Error:', err.message);
      console.error(err.stack);
      throw err;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single participation record by ID' })
  async findOne(@Param('id') id: string) {
    console.log('[findOne] id:', id);
    try {
      const result = await this.service.findOne(id);
      console.log('[findOne] result:', result);
      return result;
    } catch (err) {
      console.error('[findOne] Error:', err.message);
      console.error(err.stack);
      throw err;
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a participation record' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateActivityParticipationDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve an activity participation (admin)' })
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an activity participation (admin)' })
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a participation record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
