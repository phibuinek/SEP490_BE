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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
  constructor(
    private readonly staffAssignmentsService: StaffAssignmentsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new staff assignment' })
  @ApiResponse({
    status: 201,
    description: 'Staff assignment created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Staff has reached maximum 3 room assignments.' })
  @ApiResponse({ status: 404, description: 'Staff or room not found.' })
  @ApiResponse({
    status: 409,
    description: 'Staff is already assigned to this room.',
  })
  create(
    @Body() createStaffAssignmentDto: CreateStaffAssignmentDto,
    @Req() req: any,
  ) {
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

  @Get('by-staff/:staffId/residents')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all residents in rooms assigned to specific staff' })
  @ApiResponse({
    status: 200,
    description: 'Residents retrieved successfully, grouped by room.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          room: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              room_number: { type: 'string', example: '101' },
              room_type: { type: 'string', example: 'single' },
              status: { type: 'string', example: 'occupied' },
              bed_count: { type: 'number', example: 1 }
            }
          },
          residents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                full_name: { type: 'string', example: 'Nguyễn Văn A' },
                date_of_birth: { type: 'string', example: '1950-01-01' },
                gender: { type: 'string', example: 'male' },
                bed_id: {
                  type: 'object',
                  properties: {
                    bed_number: { type: 'string', example: '1' },
                    bed_type: { type: 'string', example: 'single' },
                    room_id: { type: 'string', example: '507f1f77bcf86cd799439011' }
                  }
                },
                family_member_id: {
                  type: 'object',
                  properties: {
                    full_name: { type: 'string', example: 'Nguyễn Văn B' },
                    email: { type: 'string', example: 'family@example.com' },
                    phone: { type: 'string', example: '0123456789' }
                  }
                }
              }
            }
          },
          assignment: {
            type: 'object',
            properties: {
              assigned_date: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
              responsibilities: { 
                type: 'array', 
                items: { type: 'string' },
                example: ['vital_signs', 'care_notes', 'activities']
              },
              notes: { type: 'string', example: 'Chăm sóc đặc biệt cho bệnh nhân cao tuổi' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  getResidentsByStaff(@Param('staffId') staffId: string) {
    return this.staffAssignmentsService.findResidentsByStaff(staffId);
  }

  @Get('by-room/:roomId')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get staff assignments by room ID' })
  @ApiResponse({
    status: 200,
    description: 'Staff assignments retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
          staff_id: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
              full_name: { type: 'string', example: 'Nguyễn Thị C' },
              email: { type: 'string', example: 'staff@example.com' },
              role: { type: 'string', example: 'staff' },
              avatar: { type: 'string', example: 'avatar.jpg' },
              position: { type: 'string', example: 'Y tá' },
              qualification: { type: 'string', example: 'Cử nhân Điều dưỡng' }
            }
          },
          room_id: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              room_number: { type: 'string', example: '101' },
              room_type: { type: 'string', example: 'single' },
              status: { type: 'string', example: 'occupied' },
              bed_count: { type: 'number', example: 1 }
            }
          },
          assigned_by: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439015' },
              full_name: { type: 'string', example: 'Admin User' },
              email: { type: 'string', example: 'admin@example.com' }
            }
          },
          assigned_date: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          end_date: { type: 'string', example: null },
          status: { type: 'string', example: 'active' },
          notes: { type: 'string', example: 'Phụ trách chăm sóc phòng 101' },
          responsibilities: { 
            type: 'array', 
            items: { type: 'string' },
            example: ['vital_signs', 'care_notes', 'activities']
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async findByRoom(@Param('roomId') roomId: string) {
    return this.staffAssignmentsService.findByRoom(roomId);
  }

  @Get('my-assignments')
  @Roles(Role.STAFF)
  @ApiOperation({
    summary: 'Get current staff assignments for logged-in staff',
  })
  @ApiResponse({
    status: 200,
    description: 'Staff assignments retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  getMyAssignments(@Req() req: any) {
    const staffId = req.user.userId;
    return this.staffAssignmentsService.findByStaff(staffId);
  }

  @Get('my-residents')
  @Roles(Role.STAFF)
  @ApiOperation({
    summary: 'Get all residents in rooms assigned to logged-in staff',
  })
  @ApiResponse({
    status: 200,
    description: 'Residents retrieved successfully, grouped by room.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          room: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              room_number: { type: 'string', example: '101' },
              room_type: { type: 'string', example: 'single' },
              status: { type: 'string', example: 'occupied' },
              bed_count: { type: 'number', example: 1 }
            }
          },
          residents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
                full_name: { type: 'string', example: 'Nguyễn Văn A' },
                date_of_birth: { type: 'string', example: '1950-01-01' },
                gender: { type: 'string', example: 'male' },
                bed_id: {
                  type: 'object',
                  properties: {
                    bed_number: { type: 'string', example: '1' },
                    bed_type: { type: 'string', example: 'single' },
                    room_id: { type: 'string', example: '507f1f77bcf86cd799439011' }
                  }
                },
                family_member_id: {
                  type: 'object',
                  properties: {
                    full_name: { type: 'string', example: 'Nguyễn Văn B' },
                    email: { type: 'string', example: 'family@example.com' },
                    phone: { type: 'string', example: '0123456789' }
                  }
                }
              }
            }
          },
          assignment: {
            type: 'object',
            properties: {
              assigned_date: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
              responsibilities: { 
                type: 'array', 
                items: { type: 'string' },
                example: ['vital_signs', 'care_notes', 'activities']
              },
              notes: { type: 'string', example: 'Chăm sóc đặc biệt cho bệnh nhân cao tuổi' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  getMyResidents(@Req() req: any) {
    const staffId = req.user.userId;
    return this.staffAssignmentsService.findResidentsByStaff(staffId);
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
  @ApiResponse({ status: 400, description: 'Bad request - Staff has reached maximum 3 room assignments.' })
  @ApiResponse({ status: 404, description: 'Staff assignment not found.' })
  @ApiResponse({
    status: 409,
    description: 'Staff is already assigned to this room.',
  })
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
