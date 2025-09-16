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
} from '@nestjs/common';
import { CarePlanAssignmentsService } from './care-plan-assignments.service';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  @Roles(Role.FAMILY, Role.ADMIN, Role.STAFF)
  create(
    @Body() createCarePlanAssignmentDto: CreateCarePlanAssignmentDto,
    @Req() req: any,
  ) {
    return this.carePlanAssignmentsService.create(
      createCarePlanAssignmentDto,
      req,
    );
  }

  @Get()
  findAll() {
    return this.carePlanAssignmentsService.findAll();
  }

  @Get('admin/pending')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending care plan assignments for admin review' })
  @ApiResponse({
    status: 200,
    description: 'Pending care plan assignments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPendingAssignments() {
    return this.carePlanAssignmentsService.getPendingAssignments();
  }

  @Patch('admin/:id/approve')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a care plan assignment' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Care plan assignment approved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  approveAssignment(@Param('id') id: string, @Req() req) {
    return this.carePlanAssignmentsService.approveAssignment(id, req.user.id);
  }

  @Patch('admin/:id/reject')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a care plan assignment' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Care plan assignment rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  rejectAssignment(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req) {
    return this.carePlanAssignmentsService.rejectAssignment(id, req.user.id, body.reason);
  }

  @Patch('admin/:id/activate')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a care plan assignment (after payment)' })
  @ApiParam({ name: 'id', description: 'Care plan assignment ID' })
  @ApiResponse({
    status: 200,
    description: 'Care plan assignment activated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  activateAssignment(@Param('id') id: string) {
    return this.carePlanAssignmentsService.activateAssignment(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carePlanAssignmentsService.findOne(id);
  }

  @Get('by-resident/:residentId')
  @ApiOperation({ summary: 'Get care plan assignments by resident ID' })
  @ApiParam({ name: 'residentId', description: 'Resident ID' })
  findByResident(@Param('residentId') residentId: string) {
    return this.carePlanAssignmentsService.findByResident(residentId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCarePlanAssignmentDto: UpdateCarePlanAssignmentDto,
  ) {
    return this.carePlanAssignmentsService.update(
      id,
      updateCarePlanAssignmentDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carePlanAssignmentsService.remove(id);
  }
} 