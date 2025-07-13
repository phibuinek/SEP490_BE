import { Controller, Post, Get, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CareNotesService } from './care-notes.service';
import { CreateCareNoteDto } from './dto/create-care-note.dto';
import { UpdateCareNoteDto } from './dto/update-care-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('CareNotes')
@ApiBearerAuth()
@Controller('care-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
export class CareNotesController {
  constructor(private readonly service: CareNotesService) {}

  @Post()
  @ApiBody({ type: CreateCareNoteDto })
  async create(@Body() dto: CreateCareNoteDto, @Req() req) {
    // Đảm bảo staffRole luôn có giá trị
    const staff = {
      staffId: req.user.userId,
      staffName: req.user.fullName || req.user.username || '',
      staffRole: req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : undefined),
    };
    return this.service.create(dto, staff);
  }

  @Get()
  async findAll(@Query('residentId') residentId: string) {
    return this.service.findAll(residentId);
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