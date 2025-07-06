import { Controller, Post, Body, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateVisitDto) {
    // Lấy family_member_id từ JWT
    const family_member_id = req.user.userId;
    return this.visitsService.create({ ...dto, family_member_id });
  }

  @Get()
  async getByFamily(
    @Req() req,
    @Query('family_member_id') family_member_id?: string
  ) {
    // Nếu truyền family_member_id thì dùng, không thì lấy từ JWT
    const famId = family_member_id || req.user.userId;
    return this.visitsService.getByFamily(famId);
  }
} 