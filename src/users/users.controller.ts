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
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
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
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { ResetPasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin', 'staff')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
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
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Tạo user mới, có thể upload avatar. Các trường sẽ thay đổi tùy theo role.',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh đại diện (tùy chọn)',
        },
        full_name: {
          type: 'string',
          description: 'Họ tên đầy đủ (bắt buộc cho tất cả roles)',
        },
        email: {
          type: 'string',
          description: 'Email (bắt buộc cho tất cả roles)',
        },
        phone: {
          type: 'string',
          description: 'Số điện thoại (bắt buộc cho tất cả roles)',
        },
        username: {
          type: 'string',
          description: 'Tên đăng nhập (bắt buộc cho tất cả roles)',
        },
        password: {
          type: 'string',
          description:
            'Mật khẩu (bắt buộc cho tất cả roles, tối thiểu 6 ký tự)',
        },
        role: {
          type: 'string',
          enum: ['admin', 'staff', 'family'],
          description: 'Vai trò người dùng (bắt buộc)',
        },
        status: {
          type: 'string',
          enum: ['active', 'inactive', 'pending', 'suspended', 'deleted'],
          description: 'Trạng thái tài khoản (mặc định: active)',
        },
        is_super_admin: {
          type: 'boolean',
          description: 'Có phải super admin không (chỉ dành cho admin)',
        },
        position: {
          type: 'string',
          description: 'Chức vụ (chủ yếu dành cho staff)',
        },
        qualification: {
          type: 'string',
          description: 'Bằng cấp/chuyên môn (chủ yếu dành cho staff)',
        },
        join_date: {
          type: 'string',
          format: 'date-time',
          description: 'Ngày vào làm (chủ yếu dành cho staff)',
        },
        address: {
          type: 'string',
          description: 'Địa chỉ (dành cho tất cả roles)',
        },
        notes: {
          type: 'string',
          description: 'Ghi chú (dành cho tất cả roles)',
        },
        created_at: {
          type: 'string',
          format: 'date-time',
          description: 'Ngày tạo (tự động)',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          description: 'Ngày cập nhật (tự động)',
        },
      },
      required: ['full_name', 'email', 'phone', 'username', 'password', 'role'],
    },
  })
  @ApiOperation({
    summary: 'Create a new user (Admin, Staff only)',
    description:
      'Tạo user mới với các trường khác nhau tùy theo role:\n' +
      '- admin: Tất cả trường\n' +
      '- staff: full_name, email, phone, username, password, role, position, qualification, join_date, address, notes\n' +
      '- family: full_name, email, phone, username, password, role, address, notes',
  })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - admin or staff role required.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - username or email already exists.',
  })
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createUserDto: CreateUserDto,
    @Req() req: any,
  ) {
    try {
      console.log(
        '[USER][CONTROLLER][CREATE] Received request with file:',
        file?.filename,
      );
      console.log(
        '[USER][CONTROLLER][CREATE] Current user role:',
        req.user?.role,
      );
      console.log(
        '[USER][CONTROLLER][CREATE] Request body:',
        JSON.stringify(createUserDto, null, 2),
      );

      // Staff chỉ có thể tạo family members
      if (req.user?.role === 'staff' && createUserDto.role !== 'family') {
        throw new BadRequestException('Staff can only create family members');
      }

      if (file) {
        createUserDto.avatar = file.path || `uploads/${file.filename}`;
      }
      return this.usersService.create(createUserDto);
    } catch (error) {
      console.error('[USER][CONTROLLER][CREATE][ERROR]', error);
      console.error(
        '[USER][CONTROLLER][CREATE][ERROR] Message:',
        error.message,
      );
      console.error(
        '[USER][CONTROLLER][CREATE][ERROR] Response:',
        error.response,
      );
      throw error;
    }
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
      throw new BadRequestException(
        `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      );
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
    const roleList = roles.split(',').map((r) => r.trim());

    for (const role of roleList) {
      if (!validRoles.includes(role)) {
        throw new BadRequestException(
          `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`,
        );
      }
    }

    return this.usersService.findByRoles(roleList);
  }

  @Get('stats/by-role')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get user statistics by role (Admin, Staff only)' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully.',
  })
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

  @Patch(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve pending user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User approved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/reject')
  @Roles('admin')
  @ApiOperation({ summary: 'Reject pending user (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for rejection (optional)',
          example: 'Thiếu thông tin cần thiết'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'User rejected successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  rejectUser(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.usersService.rejectUser(id, body.reason);
  }

  @Patch(':id/reset-password')
  @Roles('admin')
  @ApiOperation({
    summary: 'Admin reset password for user (set new password directly)',
  })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto.newPassword);
  }

  @Patch(':id')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Update user by ID (Admin, Staff only) - Basic info only',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateUserById(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      console.log('PATCH /users/:id - Input:', { id, updateUserDto });

      // Validate input
      if (!id || id.trim() === '') {
        throw new BadRequestException('User ID is required');
      }

      // Chỉ cho phép cập nhật các trường hợp lệ
      const allowedFields = [
        'full_name',
        'email',
        'phone',
        'notes',
        'address',
        'position',
        'qualification',
        'join_date',
      ];
      const filteredDto: any = {};
      for (const key of allowedFields) {
        if (
          updateUserDto[key] !== undefined &&
          updateUserDto[key] !== null &&
          updateUserDto[key] !== ''
        ) {
          filteredDto[key] = updateUserDto[key];
        }
      }

      // Kiểm tra xem có dữ liệu nào để cập nhật không
      if (Object.keys(filteredDto).length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      filteredDto.updated_at = new Date();

      console.log('PATCH /users/:id - Filtered DTO:', filteredDto);

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
        updated_at: user.updated_at,
      };

      if (user.role === 'staff') {
        return {
          ...baseFields,
          position: user.position,
          qualification: user.qualification,
          join_date: user.join_date,
        };
      }
      return baseFields;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  @Patch(':id/with-avatar')
  @Roles('admin', 'staff')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
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
    }),
  )
  @ApiOperation({
    summary: 'Update user by ID with avatar (Admin, Staff only)',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateUserByIdWithAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      // Xử lý file avatar nếu có
      if (file) {
        updateUserDto.avatar = file.path || `uploads/${file.filename}`;
      }

      // Chỉ cho phép cập nhật các trường hợp lệ
      const allowedFields = [
        'full_name',
        'email',
        'phone',
        'avatar',
        'notes',
        'address',
        'position',
        'qualification',
        'join_date',
      ];
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
        updated_at: user.updated_at,
      };

      if (user.role === 'staff') {
        return {
          ...baseFields,
          position: user.position,
          qualification: user.qualification,
          join_date: user.join_date,
        };
      }
      return baseFields;
    } catch (error) {
      console.error('Error updating user with avatar:', error);
      throw error;
    }
  }

  @Patch(':id/avatar')
  @Roles('admin', 'staff', 'family')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
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
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Cập nhật avatar cho user',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh đại diện mới',
        },
      },
      required: ['avatar'],
    },
  })
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({
    status: 200,
    description: 'User avatar updated successfully.',
  })
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
    // Lấy user hiện tại từ DB (đầy đủ trường password)
    const currentUser = await this.usersService.findOneWithPassword(id);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    // Lưu ý: password đã mã hóa, chỉ giữ nguyên, không hash lại khi update avatar
    // Xử lý các trường optional: nếu undefined thì bỏ qua hoặc truyền null
    // Đảm bảo avatar là string, không phải array
    let avatarPath = file.path || `uploads/${file.filename}`;
    if (Array.isArray(avatarPath)) {
      avatarPath = avatarPath[0];
    }
    const updateUserDto: any = {
      full_name: currentUser.full_name,
      email: currentUser.email,
      phone: currentUser.phone,
      username: currentUser.username,
      password: currentUser.password,
      role: currentUser.role,
      status: currentUser.status,
      created_at: currentUser.created_at,
      updated_at: new Date(),
      avatar: avatarPath,
    };
    if (typeof currentUser.is_super_admin !== 'undefined')
      updateUserDto.is_super_admin = currentUser.is_super_admin;
    if (typeof currentUser.position !== 'undefined')
      updateUserDto.position = currentUser.position ?? null;
    if (typeof currentUser.qualification !== 'undefined')
      updateUserDto.qualification = currentUser.qualification ?? null;
    if (typeof currentUser.join_date !== 'undefined')
      updateUserDto.join_date = currentUser.join_date ?? null;
    if (typeof currentUser.address !== 'undefined')
      updateUserDto.address = currentUser.address ?? null;
    if (typeof currentUser.notes !== 'undefined')
      updateUserDto.notes = currentUser.notes ?? null;
    // Log dữ liệu gửi lên DB
    console.log('PATCH /users/:id/avatar - updateUserDto:', updateUserDto);
    try {
      const updated = await this.usersService.updateUserById(id, updateUserDto);
      if (!updated) {
        throw new NotFoundException('User not found');
      }
      return updated;
    } catch (err) {
      // Log lỗi chi tiết nếu có
      console.error('PATCH /users/:id/avatar - MongoDB error:', err);
      if (err && err.errInfo) {
        console.error('errInfo:', JSON.stringify(err.errInfo, null, 2));
        if (err.errInfo.details) {
          console.error(
            'details:',
            JSON.stringify(err.errInfo.details, null, 2),
          );
        }
      }
      throw err;
    }
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    const validRoles = ['admin', 'staff', 'family'];
    if (!body.role || !validRoles.includes(body.role)) {
      throw new BadRequestException('Invalid role');
    }
    // Ép kiểu về UserRole
    const updated = await this.usersService.updateUserById(id, {
      role: body.role as import('./schemas/user.schema').UserRole,
      updated_at: new Date(),
    });
    const user: any = updated;
    return { _id: user._id, role: user.role, updated_at: user.updated_at };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteUser(@Param('id') id: string) {
    const deleted = await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully', _id: (deleted as any)._id };
  }

  @Get('check-phone/:phone')
  @Public()
  @ApiOperation({ summary: 'Check if phone number exists' })
  @ApiResponse({ status: 200, description: 'Phone check completed.' })
  async checkPhoneExists(@Param('phone') phone: string) {
    const exists = await this.usersService.findByPhone(phone);
    return { exists: !!exists };
  }

  @Get('check-email/:email')
  @Public()
  @ApiOperation({ summary: 'Check if email exists' })
  @ApiResponse({ status: 200, description: 'Email check completed.' })
  async checkEmailExists(@Param('email') email: string) {
    const exists = await this.usersService.findByEmail(email);
    return { exists: !!exists };
  }

  @Post('upload-cccd')
  @Roles(Role.FAMILY)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cccd_front', maxCount: 1 },
      { name: 'cccd_back', maxCount: 1 },
    ], {
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
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Family upload CCCD for themselves (auto ID from token)' })
  @ApiResponse({ status: 200, description: 'CCCD uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({
    description: 'Upload CCCD information and images',
    schema: {
      type: 'object',
      properties: {
        cccd_id: {
          type: 'string',
          description: 'CCCD ID (12 digits)',
          example: '123456789012'
        },
        cccd_front: {
          type: 'string',
          format: 'binary',
          description: 'CCCD front image (optional)'
        },
        cccd_back: {
          type: 'string',
          format: 'binary',
          description: 'CCCD back image (optional)'
        }
      },
      required: ['cccd_id']
    }
  })
  async uploadMyCccd(
    @Body('cccd_id') cccdId: string,
    @UploadedFiles() files: {
      cccd_front?: Express.Multer.File[];
      cccd_back?: Express.Multer.File[];
    },
    @Req() req,
  ) {
    const userId = req.user.userId; // Tự động lấy ID từ token

    if (!cccdId) {
      throw new BadRequestException('CCCD ID is required');
    }

    return this.usersService.uploadCccd(
      userId,
      cccdId,
      files?.cccd_front?.[0],
      files?.cccd_back?.[0],
    );
  }

  @Post(':id/upload-cccd')
  @Roles(Role.ADMIN, Role.STAFF)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cccd_front', maxCount: 1 },
      { name: 'cccd_back', maxCount: 1 },
    ], {
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
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Admin/Staff upload CCCD for specific user' })
  @ApiResponse({ status: 200, description: 'CCCD uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({
    description: 'Upload CCCD information and images',
    schema: {
      type: 'object',
      properties: {
        cccd_id: {
          type: 'string',
          description: 'CCCD ID (12 digits)',
          example: '123456789012'
        },
        cccd_front: {
          type: 'string',
          format: 'binary',
          description: 'CCCD front image (optional)'
        },
        cccd_back: {
          type: 'string',
          format: 'binary',
          description: 'CCCD back image (optional)'
        }
      },
      required: ['cccd_id']
    }
  })
  async uploadCccdForUser(
    @Param('id') userId: string,
    @Body('cccd_id') cccdId: string,
    @UploadedFiles() files: {
      cccd_front?: Express.Multer.File[];
      cccd_back?: Express.Multer.File[];
    },
  ) {
    if (!cccdId) {
      throw new BadRequestException('CCCD ID is required');
    }

    return this.usersService.uploadCccd(
      userId,
      cccdId,
      files?.cccd_front?.[0],
      files?.cccd_back?.[0],
    );
  }
}
