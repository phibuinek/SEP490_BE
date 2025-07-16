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
} from '@nestjs/common';
import { ActivityParticipationsService } from './activity-participations.service';
import { CreateActivityParticipationDto } from './dto/create-activity-participation.dto';
import { UpdateActivityParticipationDto } from './dto/update-activity-participation.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Activity Participations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activity-participations')
export class ActivityParticipationsController {
  constructor(private readonly service: ActivityParticipationsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new activity participation' })
  create(@Body() createDto: CreateActivityParticipationDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activity participation records' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single participation record by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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

  @Get('by-resident')
  @ApiOperation({ summary: 'Get all activity participations by residentId' })
  async getByResident(@Query('resident_id') resident_id: string) {
    return this.service.findByResidentId(resident_id);
  }
}
