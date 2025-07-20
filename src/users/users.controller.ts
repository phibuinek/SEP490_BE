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
