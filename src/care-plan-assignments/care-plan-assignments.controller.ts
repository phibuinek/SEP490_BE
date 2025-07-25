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
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
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
    description: 'Return care plan assignments for family member',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByFamilyMember(@Param('familyMemberId') familyMemberId: string) {
    return this.carePlanAssignmentsService.findByFamilyMember(familyMemberId);
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
