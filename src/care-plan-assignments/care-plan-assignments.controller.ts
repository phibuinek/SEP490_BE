import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CarePlanAssignmentsService } from './care-plan-assignments.service';
import { CarePlanAssignmentsSchedulerService } from './care-plan-assignments-scheduler.service';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
import { RenewAssignmentDto } from './dto/renew-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('care-plan-assignments')
@ApiBearerAuth()
@Controller('care-plan-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarePlanAssignmentsController {
  constructor(
    private readonly carePlanAssignmentsService: CarePlanAssignmentsService,
    private readonly carePlanAssignmentsSchedulerService: CarePlanAssignmentsSchedulerService,
  ) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new care plan assignment' })
  @ApiResponse({
    status: 201,
    description: 'Care plan assignment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createCarePlanAssignmentDto: CreateCarePlanAssignmentDto, @Req() req) {
    return this.carePlanAssignmentsService.create(createCarePlanAssignmentDto, req);
  }

  @Get()
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all care plan assignments' })
  @ApiResponse({ status: 200, description: 'Return all care plan assignments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.carePlanAssignmentsService.findAll();
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN, Role.FAMILY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a care plan assignment by ID' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Return care plan assignment details',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Care plan assignment not found' })
  findOne(@Param('id') id: string) {
    return this.carePlanAssignmentsService.findOne(id);
  }

  @Get('by-resident/:resident_id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({
    summary: 'Get care plan assignments by resident ID',
  })
  @ApiParam({ name: 'resident_id', description: 'Resident ID' })
  @ApiResponse({
    status: 200,
    description: 'Care plan assignments for the resident.',
  })
  @ApiResponse({ status: 404, description: 'No assignments found.' })
  findByResident(@Param('resident_id') resident_id: string) {
    return this.carePlanAssignmentsService.findByResident(resident_id);
  }

  @Get('by-family-member/:familyMemberId')
  @Roles(Role.STAFF, Role.ADMIN, Role.FAMILY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get care plan assignments by family member ID' })
  @ApiParam({ name: 'familyMemberId', description: 'Family member ID' })
  @ApiResponse({
    status: 200,
    description: 'Care plan assignments for the family member.',
  })
  @ApiResponse({ status: 404, description: 'No assignments found.' })
  findByFamilyMember(@Param('familyMemberId') familyMemberId: string) {
    return this.carePlanAssignmentsService.findByFamilyMember(familyMemberId);
  }

  @Get('unregistered-residents')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get residents without care plan assignments' })
  @ApiResponse({
    status: 200,
    description: 'List of residents who have not been assigned any care plans.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getUnregisteredResidents() {
    return this.carePlanAssignmentsService.getUnregisteredResidents();
  }

  @Get('by-status/:status')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get care plan assignments by status' })
  @ApiParam({
    name: 'status',
    description: 'Status filter',
    enum: [
      'consulting',
      'packages_selected',
      'room_assigned',
      'payment_completed',
      'active',
      'completed',
      'cancelled',
      'paused',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'Return care plan assignments by status',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByStatus(@Param('status') status: string) {
    return this.carePlanAssignmentsService.findByStatus(status);
  }

  @Patch(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a care plan assignment' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Care plan assignment updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Care plan assignment not found' })
  update(
    @Param('id') id: string,
    @Body() updateCarePlanAssignmentDto: UpdateCarePlanAssignmentDto,
  ) {
    return this.carePlanAssignmentsService.update(
      id,
      updateCarePlanAssignmentDto,
    );
  }

  @Patch(':id/status')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update care plan assignment status' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiQuery({
    name: 'status',
    description: 'New status',
    enum: [
      'consulting',
      'packages_selected',
      'room_assigned',
      'payment_completed',
      'active',
      'completed',
      'cancelled',
      'paused',
    ],
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Care plan assignment not found' })
  updateStatus(@Param('id') id: string, @Query('status') status: string) {
    return this.carePlanAssignmentsService.updateStatus(id, status);
  }

  @Patch(':id/renew')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renew a paused care plan assignment' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiResponse({ status: 200, description: 'Assignment renewed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Care plan assignment not found' })
  renewAssignment(
    @Param('id') id: string,
    @Body() renewAssignmentDto: RenewAssignmentDto,
  ) {
    return this.carePlanAssignmentsService.renewAssignment(
      id, 
      renewAssignmentDto.newEndDate,
      renewAssignmentDto.newStartDate
    );
  }

  @Post('check-expired')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger check for expired assignments' })
  @ApiResponse({ status: 200, description: 'Check completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async checkExpiredAssignments() {
    await this.carePlanAssignmentsSchedulerService.manualCheckExpiredAssignments();
    return { message: 'Expired assignments check completed' };
  }

  @Post('check-upcoming-expirations')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually trigger check for upcoming expirations' })
  @ApiResponse({ status: 200, description: 'Check completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async checkUpcomingExpirations() {
    await this.carePlanAssignmentsSchedulerService.manualCheckUpcomingExpirations();
    return { message: 'Upcoming expirations check completed' };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a care plan assignment' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Care plan assignment deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Care plan assignment not found' })
  remove(@Param('id') id: string) {
    return this.carePlanAssignmentsService.remove(id);
  }
}
