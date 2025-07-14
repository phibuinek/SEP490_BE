import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { BedAssignmentsService } from './bed-assignments.service';
import { CreateBedAssignmentDto } from './dto/create-bed-assignment.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('BedAssignments')
@Controller('bed-assignments')
export class BedAssignmentsController {
  constructor(private readonly service: BedAssignmentsService) {}

  @Post()
  create(@Body() dto: CreateBedAssignmentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('bed_id') bed_id?: string, @Query('resident_id') resident_id?: string) {
    return this.service.findAll(bed_id, resident_id);
  }

  @Patch(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.service.unassign(id);
  }
} 