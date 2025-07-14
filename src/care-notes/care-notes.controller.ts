import { Controller, Post, Get, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CareNotesService } from './care-notes.service';
import { CreateAssessmentDto } from './dto/create-care-note.dto';
import { UpdateCareNoteDto } from './dto/update-care-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
export class AssessmentsController {
  constructor(private readonly service: CareNotesService) {}

  @Post()
  @ApiBody({ type: CreateAssessmentDto })
  async create(@Body() dto: CreateAssessmentDto, @Req() req) {
    const conducted_by = dto.conducted_by || req.user?.userId;
    return this.service.create({ ...dto, conducted_by });
  }

  @Get()
  async findAll(@Query('resident_id') resident_id: string) {
    return this.service.findAll(resident_id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCareNoteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
} 