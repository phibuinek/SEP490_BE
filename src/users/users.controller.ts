import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ResetPasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin', 'staff', 'family')
  @ApiOperation({ summary: 'Get all users (Admin, Staff, Family)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('by-role')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get users by role (Admin, Staff only)' })
  @ApiQuery({
    name: 'role',
    required: true,
    enum: ['admin', 'staff', 'family'],
    description: 'Role để lọc users',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid role.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findByRole(@Query('role') role: string) {
    // Validate role parameter
    const validRoles = ['admin', 'staff', 'family'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    return this.usersService.findAll(undefined, role);
  }

  @Get('by-roles')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get users by multiple roles (Admin, Staff only)' })
  @ApiQuery({
    name: 'roles',
    required: true,
    description: 'Comma-separated list of roles (e.g., admin,staff)',
    example: 'admin,staff',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid roles.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findByRoles(@Query('roles') roles: string) {
    // Validate and parse roles parameter
    const validRoles = ['admin', 'staff', 'family'];
    const roleList = roles.split(',').map(r => r.trim());
    
    for (const role of roleList) {
      if (!validRoles.includes(role)) {
        throw new BadRequestException(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
      }
    }
    
    return this.usersService.findByRoles(roleList);
  }

  @Get('stats/by-role')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get user statistics by role (Admin, Staff only)' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getUserStatsByRole() {
    return this.usersService.getUserStatsByRole();
  }

  @Get('by-department')
  @Roles('admin')
  @ApiOperation({ summary: 'Get staff by department (Admin only)' })
  @ApiQuery({
    name: 'department',
    required: true,
    enum: [
      'y_te',
      'cham_soc_nguoi_cao_tuoi',
      'phuc_hoi_chuc_nang',
      'hoat_dong',
      'quan_ly',
    ],
    description: 'Lọc theo khoa/phòng ban',
  })
  findByDepartment(@Query('department') department: string) {
    return this.usersService.findByDepartment(department);
  }

  @Get(':id')
  @Roles('admin', 'staff', 'family')
  @ApiOperation({ summary: 'Get user by ID (All roles)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/roles')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user roles (Admin only)' })
  @ApiResponse({ status: 200, description: 'User roles updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  updateRoles(
    @Param('id') id: string,
    @Body() updateRolesDto: { roles: string[] },
  ) {
    return this.usersService.updateRoles(id, updateRolesDto.roles);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Public()
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate user (Anyone can activate)' })
  @ApiResponse({ status: 200, description: 'User activated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }

  @Patch(':id/reset-password')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin reset password for user (set new password directly)' })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto.newPassword);
  }
}
