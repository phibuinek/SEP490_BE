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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffAssignmentsService } from './staff-assignments.service';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto';
import { UpdateStaffAssignmentDto } from './dto/update-staff-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('staff-assignments')
@ApiBearerAuth()
@Controller('staff-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffAssignmentsController {
  constructor(private readonly staffAssignmentsService: StaffAssignmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new staff assignment' })
  @ApiResponse({
    status: 201,
    description: 'Staff assignment created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Staff or resident not found.' })
  @ApiResponse({ status: 409, description: 'Staff is already assigned to this resident.' })
  create(@Body() createStaffAssignmentDto: CreateStaffAssignmentDto, @Req() req: any) {
    return this.staffAssignmentsService.create(createStaffAssignmentDto, req);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all active staff assignments' })
  @ApiResponse({
    status: 200,
    description: 'Active staff assignments retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  findAll() {
    return this.staffAssignmentsService.findAll();
  }

  @Get('all-including-expired')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all staff assignments including expired ones' })
  @ApiResponse({
    status: 200,
    description: 'All staff assignments retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  findAllIncludingExpired() {
    return this.staffAssignmentsService.findAllIncludingExpired();
  }

  @Get('by-staff/:staffId')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get staff assignments by staff ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignments retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  findByStaff(@Param('staffId') staffId: string) {
    return this.staffAssignmentsService.findByStaff(staffId);
  }

  @Get('by-resident/:residentId')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get staff assignments by resident ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignments retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  findByResident(@Param('residentId') residentId: string) {
    return this.staffAssignmentsService.findByResident(residentId);
  }

  @Get('my-assignments')
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Get current staff assignments for logged-in staff' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignments retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  getMyAssignments(@Req() req: any) {
    const staffId = req.user.userId;
    return this.staffAssignmentsService.findByStaff(staffId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get a specific staff assignment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignment retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Staff assignment not found.' })
  findOne(@Param('id') id: string) {
    return this.staffAssignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a staff assignment' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignment updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Staff assignment not found.' })
  @ApiResponse({ status: 409, description: 'Staff is already assigned to this resident.' })
  update(
    @Param('id') id: string,
    @Body() updateStaffAssignmentDto: UpdateStaffAssignmentDto,
  ) {
    return this.staffAssignmentsService.update(id, updateStaffAssignmentDto);
  }



  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a staff assignment' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignment deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Staff assignment not found.' })
  remove(@Param('id') id: string) {
    return this.staffAssignmentsService.remove(id);
  }
} 