import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { BedAssignmentsService } from './bed-assignments.service';
import { CreateBedAssignmentDto } from './dto/create-bed-assignment.dto';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResidentsService } from '../residents/residents.service';
import { Role } from '../common/enums/role.enum';

@ApiBearerAuth()
@ApiTags('BedAssignments')
@Controller('bed-assignments')
export class BedAssignmentsController {
  constructor(
    private readonly service: BedAssignmentsService,
    private readonly residentsService: ResidentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateBedAssignmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'bed_id', required: false })
  @ApiQuery({ name: 'resident_id', required: false })
  async findAll(
    @Req() req,
    @Query('bed_id') bed_id?: string,
    @Query('resident_id') resident_id?: string,
  ) {
    const userRole = req.user?.role;
    if (userRole === Role.FAMILY) {
      throw new ForbiddenException('Family cannot view all bed assignments');
    }
    // STAFF/ADMIN: xem toàn bộ hoặc lọc theo bed_id/resident_id nếu có
    return this.service.findAll(bed_id, resident_id);
  }

  @Get('by-resident')
  @ApiQuery({ name: 'resident_id', required: true })
  async getByResident(
    @Query('resident_id') resident_id: string,
    @Req() req
  ) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    if (userRole === Role.FAMILY) {
      // Kiểm tra resident này có thuộc về family không
      const resident = await this.residentsService.findOne(resident_id);
      if (!resident || resident.family_member_id.toString() !== userId) {
        throw new ForbiddenException('Bạn không có quyền xem bed assignment này');
      }
    }
    // Gọi đúng hàm populate đủ thông tin
    return this.service.findByResidentId(resident_id);
  }

  @Patch(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.service.unassign(id);
  }
}
