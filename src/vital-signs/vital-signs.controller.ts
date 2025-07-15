import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { ResidentsService } from '../residents/residents.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@ApiTags('Vital Signs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vital-signs')
export class VitalSignsController {
  constructor(
    private readonly service: VitalSignsService,
    private readonly residentsService: ResidentsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new vital sign record' })
  create(@Body() dto: CreateVitalSignDto, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all vital sign records' })
  findAll() {
    return this.service.findAll();
  }

  @Get('resident/:residentId')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY_MEMBER)
  @ApiOperation({ summary: 'Get all vital signs by resident ID' })
  async findAllByResidentId(
    @Param('residentId') residentId: string,
    @Req() req,
  ) {
    const user = req.user;

    // Lấy thông tin resident để kiểm tra quyền
    const resident = await this.residentsService.findOne(residentId);

    if (user.roles.includes(Role.ADMIN) || user.roles.includes(Role.STAFF)) {
      return this.service.findAllByResidentId(residentId);
    }

    if (
      user.roles.includes(Role.FAMILY_MEMBER) &&
      resident.family_member_id?.toString() === user.userId
    ) {
      return this.service.findAllByResidentId(residentId);
    }

    throw new ForbiddenException(
      'Bạn không có quyền xem vital signs của resident này!',
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY_MEMBER)
  @ApiOperation({ summary: 'Get a vital sign record by ID' })
  async findOne(@Param('id') id: string, @Req() req) {
    const vitalSign = await this.service.findOne(id);
    const user = req.user;

    // Lấy thông tin resident để kiểm tra quyền
    const resident = await this.residentsService.findOne(
      vitalSign.residentId.toString(),
    );

    if (user.roles.includes(Role.ADMIN) || user.roles.includes(Role.STAFF)) {
      return vitalSign;
    }

    if (
      user.roles.includes(Role.FAMILY_MEMBER) &&
      resident.family_member_id?.toString() === user.userId
    ) {
      return vitalSign;
    }

    throw new ForbiddenException('Bạn không có quyền xem vital sign này!');
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a vital sign record' })
  update(@Param('id') id: string, @Body() dto: UpdateVitalSignDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a vital sign record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
