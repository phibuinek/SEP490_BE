import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

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

  @Post('multiple')
  async createMultiple(@Req() req, @Body() dto: any) {
    // Lấy family_member_id từ JWT
    const family_member_id = req.user.userId;
    return this.visitsService.createMultiple({ ...dto, family_member_id });
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  async getAllVisits() {
    return this.visitsService.getAll();
  }

  @Get('family')
  async getByFamily(
    @Req() req,
    @Query('family_member_id') family_member_id?: string,
  ) {
    // Nếu truyền family_member_id thì dùng, không thì lấy từ JWT
    const famId = family_member_id || req.user.userId;
    console.log('Getting visits for family member ID:', famId);
    const visits = await this.visitsService.getByFamily(famId);
    console.log('Found visits:', visits.length);
    return visits;
  }

  @Delete(':id')
  async deleteVisit(@Param('id') id: string) {
    return this.visitsService.deleteById(id);
  }
}
