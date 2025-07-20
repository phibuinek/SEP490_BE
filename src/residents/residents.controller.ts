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
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../common/enums/role.enum';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ 
    summary: 'Create a new resident',
    description: 'Create a new resident. admission_date will be automatically set to current date (Vietnam timezone GMT+7) and discharge_date will be set to null.'
  })
  @ApiResponse({ status: 201, description: 'Resident created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createResidentDto: CreateResidentDto) {
    return this.residentsService.create(createResidentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all residents' })
  @ApiResponse({
    status: 200,
    description: 'Residents retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.residentsService.findAll();
  }

  @Get('family-member/:familyMemberId')
  @Roles(Role.FAMILY, Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get residents by family member ID' })
  @ApiResponse({
    status: 200,
    description: 'Residents retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAllByFamilyMemberId(@Param('familyMemberId') familyMemberId: string) {
    return this.residentsService.findAllByFamilyMemberId(familyMemberId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get resident by ID' })
  @ApiResponse({ status: 200, description: 'Resident retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  async findOne(@Param('id') id: string, @Req() req) {
    const resident = await this.residentsService.findOne(id);
    const user = req.user;
    if (user.role === Role.ADMIN || user.role === Role.STAFF) {
      return resident;
    }
    if (
      user.role === Role.FAMILY &&
      resident.family_member_id?.toString() === user.userId
    ) {
      return resident;
    }
    throw new ForbiddenException('Bạn không có quyền xem resident này!');
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a resident' })
  @ApiResponse({ status: 200, description: 'Resident updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  update(
    @Param('id') id: string,
    @Body() updateResidentDto: UpdateResidentDto,
  ) {
    return this.residentsService.update(id, updateResidentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a resident' })
  @ApiResponse({ status: 200, description: 'Resident deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  remove(@Param('id') id: string) {
    return this.residentsService.remove(id);
  }

  @Post(':id/assign-bed/:bed_id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Assign a bed to a resident' })
  @ApiResponse({
    status: 200,
    description: 'Bed assigned successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Resident or bed not found.' })
  assignBed(@Param('id') id: string, @Param('bed_id') bed_id: string) {
    return this.residentsService.assignBed(id, bed_id);
  }
}
