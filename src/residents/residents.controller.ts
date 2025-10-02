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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { DischargeResidentDto } from './dto/discharge-resident.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../common/enums/role.enum';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import { ResidentStatus } from './schemas/resident.schema';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post('my-resident')
  @Roles(Role.FAMILY)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'cccd_front', maxCount: 1 },
      { name: 'cccd_back', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
            const baseDir = isProd ? path.join('/tmp') : process.cwd();
            const uploadPath = path.join(baseDir, 'uploads');
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          } catch (err) {
            cb(err as any, '');
          }
        },
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
    description: 'Family tạo resident cho chính mình (tự động lấy family_member_id từ token)',
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Ảnh đại diện (tùy chọn)' },
        cccd_front: { type: 'string', format: 'binary', description: 'Ảnh CCCD mặt trước của resident (bắt buộc)' },
        cccd_back: { type: 'string', format: 'binary', description: 'Ảnh CCCD mặt sau của resident (bắt buộc)' },
        full_name: { type: 'string', description: 'Họ tên đầy đủ' },
        gender: { type: 'string', description: 'Giới tính' },
        date_of_birth: { type: 'string', format: 'date', description: 'Ngày sinh' },
        cccd_id: { type: 'string', description: 'Mã số CCCD của resident (12 chữ số)', pattern: '^[0-9]{12}$' },
        relationship: { type: 'string', description: 'Mối quan hệ với thành viên gia đình' },
        medical_history: { type: 'string', description: 'Tiền sử bệnh' },
        current_medications: {
          type: 'string',
          description: 'Danh sách thuốc đang dùng (JSON array string, tùy chọn)',
          example: '[{"medication_name":"Aspirin","dosage":"81mg","frequency":"Sáng"}]',
        },
        allergies: {
          type: 'string',
          description: 'Dị ứng (JSON array string, tùy chọn)',
          example: '["Hải sản","Thuốc kháng sinh"]',
        },
        emergency_contact: {
          type: 'string',
          description: 'Liên hệ khẩn cấp (bắt buộc) - JSON string',
          example: '{"name":"John Doe","phone":"0123456789","relationship":"Son"}'
        },
      },
      required: [
        'full_name',
        'gender',
        'date_of_birth',
        'cccd_id',
        'cccd_front',
        'cccd_back',
        'relationship',
        'emergency_contact',
      ],
    },
  })
  @ApiOperation({ summary: 'Family create resident for themselves (auto family_member_id from token)' })
  createMyResident(
    @UploadedFiles() files: {
      avatar?: Express.Multer.File[];
      cccd_front?: Express.Multer.File[];
      cccd_back?: Express.Multer.File[];
    },
    @Body() createResidentDto: CreateResidentDto,
    @Req() req,
  ) {
    // Tự động lấy family_member_id từ token
    createResidentDto.family_member_id = req.user.userId;

    // Map uploaded files to DTO fields - always store relative paths
    if (files?.avatar?.[0]) {
      createResidentDto.avatar = `uploads/${files.avatar[0].filename}`.replace(/\\/g, '/');
    }
    if (files?.cccd_front?.[0]) {
      createResidentDto.cccd_front = `uploads/${files.cccd_front[0].filename}`.replace(/\\/g, '/');
    }
    if (files?.cccd_back?.[0]) {
      createResidentDto.cccd_back = `uploads/${files.cccd_back[0].filename}`.replace(/\\/g, '/');
    }

    // Debug all data
    console.log('[CONTROLLER] Full createResidentDto:', JSON.stringify(createResidentDto, null, 2));
    console.log('[CONTROLLER] emergency_contact type:', typeof createResidentDto.emergency_contact);
    console.log('[CONTROLLER] emergency_contact value:', createResidentDto.emergency_contact);
    
    // Parse emergency_contact string to object
    if (typeof createResidentDto.emergency_contact === 'string') {
      try {
        const parsed = JSON.parse(createResidentDto.emergency_contact);
        console.log('[CONTROLLER] Parsed emergency_contact:', parsed);
        createResidentDto.emergency_contact = parsed;
      } catch (error) {
        console.log('[CONTROLLER] Failed to parse emergency_contact:', createResidentDto.emergency_contact, error);
        createResidentDto.emergency_contact = {
          name: "Chưa cập nhật",
          phone: "0000000000",
          relationship: "Chưa cập nhật"
        };
      }
    }

    return this.residentsService.create(createResidentDto);
  }

  // Removed Admin/Staff create-resident endpoint

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ 
    summary: 'Get active residents with pagination',
    description: 'Get residents with active statuses only (accepted, admitted, active). Use /residents/all-statuses to see all statuses.'
  })
  findAll(@Query() pagination: PaginationDto) {
    return this.residentsService.findAll(pagination);
  }

  @Get('family-member/:familyMemberId')
  @Roles(Role.FAMILY, Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get residents by family member ID' })
  findAllByFamilyMemberId(@Param('familyMemberId') familyMemberId: string) {
    return this.residentsService.findAllByFamilyMemberId(familyMemberId);
  }

  // 🔹 Các route tĩnh đưa lên trước
  @Get('accepted/family-member/:familyMemberId')
  @Roles(Role.FAMILY, Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get accepted residents by family member ID' })
  findAcceptedResidentsByFamily(
    @Param('familyMemberId') familyMemberId: string,
  ) {
    return this.residentsService.findActiveResidentsByFamily(familyMemberId);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all pending residents' })
  findPendingResidents() {
    return this.residentsService.findPendingResidents();
  }

  @Get('pending/with-registrations')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get pending residents with their service registrations for approval' })
  getPendingWithRegistrations() {
    return this.residentsService.findPendingWithRegistrations();
  }

  @Get('accepted')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all accepted residents' })
  findAllAccepted() {
    return this.residentsService.findAllAccepted();
  }
  @Get('admitted')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all admitted residents' })
  findAllAdmitted() {
    return this.residentsService.findAllAdmitted();
  }

  @Get('active')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all active residents' })
  findAllActive() {
    return this.residentsService.findAllActive();
  }

  @Get('all-statuses')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ 
    summary: 'Get all residents with all statuses',
    description: 'Get residents including all statuses: pending, accepted, rejected, admitted, active, discharged, deceased'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: 'number',
    description: 'Page number (default: 1)'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: 'number',
    description: 'Items per page (default: 10)'
  })
  findAllWithAllStatuses(@Query() pagination: PaginationDto) {
    return this.residentsService.findAllWithAllStatuses(pagination);
  }
  @Get('by-room/:roomId/admitted')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get admitted residents by room ID' })
  @ApiParam({ name: 'roomId', description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Admitted residents retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid room ID' })
  async findAdmittedByRoom(@Param('roomId') roomId: string) {
    return this.residentsService.findAdmittedResidentsByRoom(roomId);
  }

  @Get('rooms/with-admitted')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all rooms that have admitted residents' })
  @ApiResponse({ 
    status: 200, 
    description: 'Rooms with admitted residents retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          room_id: { type: 'string' },
          room_number: { type: 'string' },
          room_type: { type: 'string' },
          capacity: { type: 'number' },
          admitted_residents_count: { type: 'number' },
          residents: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                resident_id: { type: 'string' },
                full_name: { type: 'string' },
                bed_id: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findRoomsWithAdmittedResidents() {
    return this.residentsService.findRoomsWithAdmittedResidents();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get resident by ID' })
  async findOne(@Param('id') id: string, @Req() req) {
    const resident = await this.residentsService.findOne(id);
    const user = req.user;

    if (user.role === Role.ADMIN || user.role === Role.STAFF) {
      return resident;
    }

    if (user.role === Role.FAMILY) {
      const familyMemberIdStr =
        typeof resident.family_member_id === 'object' &&
        resident.family_member_id?._id
          ? resident.family_member_id._id.toString()
          : resident.family_member_id?.toString();
      if (familyMemberIdStr === user.userId?.toString()) {
        return resident;
      }
      throw new ForbiddenException('Bạn không có quyền xem resident này!');
    }

    throw new ForbiddenException('Bạn không có quyền xem resident này!');
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
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
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Update a resident' })
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateResidentDto: UpdateResidentDto,
    @Req() req,
  ) {
    if (file) {
      updateResidentDto.avatar = file.path || `uploads/${file.filename}`;
    }
    return this.residentsService.update(id, updateResidentDto, req.user.role);
  }

  @Get(':id/avatar')
  @ApiOperation({ summary: 'Get resident avatar' })
  async getAvatar(@Param('id') id: string) {
    const resident = await this.residentsService.findOne(id);
    if (!resident || !resident.avatar) {
      throw new BadRequestException('Avatar not found');
    }
    return { avatar: resident.avatar };
  }

  @Patch(':id/avatar')
  @Roles(Role.ADMIN, Role.STAFF)
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
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Update resident avatar' })
  async updateAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (!file) throw new BadRequestException('Avatar file is required');
    return this.residentsService.update(
      id,
      { avatar: file.path || `uploads/${file.filename}` },
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Delete a resident' })
  @ApiBody({
    schema: { type: 'object', properties: { reason: { type: 'string' } } },
  })
  remove(@Param('id') id: string, @Req() req, @Body('reason') reason: string) {
    return this.residentsService.remove(id, req.user.role, reason);
  }

  @Post(':id/assign-bed/:bed_id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Assign a bed to a resident' })
  assignBed(@Param('id') id: string, @Param('bed_id') bed_id: string) {
    return this.residentsService.assignBed(id, bed_id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update resident status (accept/reject)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['accepted', 'rejected'],
          description: 'Status to update (accepted or rejected)'
        },
        reason: {
          type: 'string',
          description: 'Reason for rejection (optional)',
          example: 'Thiếu giấy tờ cần thiết'
        }
      },
      required: ['status']
    }
  })
  @ApiResponse({ status: 200, description: 'Resident status updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid status or resident not in pending status.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ResidentStatus.ACCEPTED | ResidentStatus.REJECTED,
    @Body('reason') reason?: string,
  ) {
    console.log(`[CONTROLLER] Updating resident ${id} status to ${status}`);
    return this.residentsService.updateStatus(id, status, reason);
  }

  @Post(':id/attendance')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Mark resident attendance (admitted if present)' })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponse({ status: 200, description: 'Resident marked as admitted.' })
  @ApiResponse({ status: 400, description: 'Only ACTIVE residents can be admitted.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  markAttendance(@Param('id') id: string) {
    return this.residentsService.markAttendancePresent(id);
  }

  // Admin endpoints for resident approval
  @Get('admin/pending')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending residents for admin review' })
  @ApiResponse({
    status: 200,
    description: 'Pending residents retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPendingResidents() {
    return this.residentsService.getPendingResidents();
  }

  @Patch('admin/:id/approve')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a resident registration' })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponse({
    status: 200,
    description: 'Resident approved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  approveResident(@Param('id') id: string) {
    return this.residentsService.updateStatus(id, ResidentStatus.ACCEPTED);
  }

  @Patch('admin/:id/reject')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a resident registration' })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponse({
    status: 200,
    description: 'Resident rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  rejectResident(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.residentsService.updateStatus(id, ResidentStatus.REJECTED, body.reason);
  }

  @Patch(':id/discharge')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Discharge a resident (discharged or deceased)' })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['discharged', 'deceased'],
          description: 'Discharge status - either discharged or deceased'
        },
        reason: {
          type: 'string',
          description: 'Reason for discharge (required)'
        }
      },
      required: ['status', 'reason']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Resident discharged successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status or missing reason' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  async dischargeResident(
    @Param('id') id: string,
    @Body() dischargeData: DischargeResidentDto
  ) {
    return this.residentsService.dischargeResident(id, dischargeData);
  }
}
