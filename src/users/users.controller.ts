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
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ResetPasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Tạo user mới, có thể upload avatar',
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Ảnh đại diện (tùy chọn)' },
        username: { type: 'string' },
        password: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' },
        // ... các trường khác của CreateUserDto ...
      },
      required: ['username', 'password', 'email', 'role'],
    },
  })
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@UploadedFile() file: Express.Multer.File, @Body() createUserDto: CreateUserDto) {
    if (file) {
      createUserDto.avatar = file.path || `uploads/${file.filename}`;
    }
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

  @Patch(':id')
  @Roles('admin', 'staff')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @ApiOperation({ summary: 'Update user by ID (Admin, Staff only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateUserById(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto
  ) {
    if (file) {
      updateUserDto.avatar = file.path || `uploads/${file.filename}`;
    }
    // Chỉ cho phép cập nhật các trường hợp lệ
    const allowedFields = ['full_name', 'email', 'phone', 'avatar', 'notes', 'address', 'position', 'qualification'];
    const filteredDto: any = {};
    for (const key of allowedFields) {
      if (updateUserDto[key] !== undefined) {
        filteredDto[key] = updateUserDto[key];
      }
    }
    filteredDto.updated_at = new Date();
    const updated = await this.usersService.updateUserById(id, filteredDto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    const user: any = updated;
    const baseFields = {
      _id: user._id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      notes: user.notes,
      address: user.address,
      role: user.role,
      status: user.status,
      updated_at: user.updated_at
    };
    if (user.role === 'staff') {
      return { ...baseFields, position: user.position, qualification: user.qualification, join_date: user.join_date };
    }
    return baseFields;
  }

  @Patch(':id/avatar')
  @Roles('admin', 'staff')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Cập nhật avatar cho user',
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Ảnh đại diện mới' },
      },
      required: ['avatar'],
    },
  })
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({ status: 200, description: 'User avatar updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }
    const updateUserDto = { avatar: file.path || `uploads/${file.filename}` };
    const updated = await this.usersService.updateUserById(id, updateUserDto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    const validRoles = ['admin', 'staff', 'family'];
    if (!body.role || !validRoles.includes(body.role)) {
      throw new BadRequestException('Invalid role');
    }
    // Ép kiểu về UserRole
    const updated = await this.usersService.updateUserById(id, { role: body.role as import('./schemas/user.schema').UserRole, updated_at: new Date() });
    const user: any = updated;
    return { _id: user._id, role: user.role, updated_at: user.updated_at };
  }
}
