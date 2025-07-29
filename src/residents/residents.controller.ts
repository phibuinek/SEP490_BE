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
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../common/enums/role.enum';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
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
    description: 'Tạo resident mới, có thể upload avatar',
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Ảnh đại diện (tùy chọn)' },
        full_name: { type: 'string', description: 'Họ tên đầy đủ' },
        gender: { type: 'string', description: 'Giới tính' },
        date_of_birth: { type: 'string', format: 'date', description: 'Ngày sinh' },
        family_member_id: { type: 'string', description: 'ID thành viên gia đình' },
        relationship: { type: 'string', description: 'Mối quan hệ với thành viên gia đình' },
        medical_history: { type: 'string', description: 'Tiền sử bệnh' },
        current_medications: {
          type: 'array',
          description: 'Danh sách thuốc đang dùng',
          items: {
            type: 'object',
            properties: {
              medication_name: { type: 'string', description: 'Tên thuốc' },
              dosage: { type: 'string', description: 'Liều lượng' },
              frequency: { type: 'string', description: 'Tần suất' },
            },
            required: ['medication_name', 'dosage', 'frequency'],
          },
        },
        allergies: {
          type: 'array',
          description: 'Dị ứng',
          items: { type: 'string' },
        },
        emergency_contact: {
          type: 'object',
          description: 'Liên hệ khẩn cấp',
          properties: {
            name: { type: 'string', description: 'Tên người liên hệ' },
            phone: { type: 'string', description: 'Số điện thoại' },
            relationship: { type: 'string', description: 'Mối quan hệ' },
          },
          required: ['name', 'phone', 'relationship'],
        },
      },
      required: ['full_name', 'gender', 'date_of_birth', 'family_member_id', 'relationship', 'medical_history', 'current_medications', 'allergies'],
    },
  })
  @ApiOperation({ 
    summary: 'Create a new resident',
    description: 'Create a new resident. admission_date will be automatically set to current date (Vietnam timezone GMT+7) and discharge_date will be set to null.'
  })
  @ApiResponse({ status: 201, description: 'Resident created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@UploadedFile() file: Express.Multer.File, @Body() createResidentDto: CreateResidentDto) {
    console.log('[RESIDENT][CONTROLLER][CREATE] Received request with file:', file?.filename);
    console.log('[RESIDENT][CONTROLLER][CREATE] Request body:', JSON.stringify(createResidentDto, null, 2));
    
    if (file) {
      createResidentDto.avatar = file.path || `uploads/${file.filename}`;
      console.log('[RESIDENT][CONTROLLER][CREATE] Avatar path set:', createResidentDto.avatar);
    }
    
    return this.residentsService.create(createResidentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all residents' })
  @ApiResponse({
    status: 200,
    description: 'Residents retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.residentsService.findAll();
  }

  @Get('family-member/:familyMemberId')
  @Roles(Role.FAMILY, Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get residents by family member ID' })
  @ApiResponse({
    status: 200,
    description: 'Residents retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAllByFamilyMemberId(@Param('familyMemberId') familyMemberId: string) {
    return this.residentsService.findAllByFamilyMemberId(familyMemberId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get resident by ID' })
  @ApiResponse({ status: 200, description: 'Resident retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  async findOne(@Param('id') id: string, @Req() req) {
    const resident = await this.residentsService.findOne(id);
    const user = req.user;
    
    console.log('=== RESIDENT ACCESS DEBUG ===');
    console.log('Resident ID:', id);
    console.log('User role:', user.role);
    console.log('User ID:', user.userId);
    console.log('Resident family_member_id:', resident.family_member_id);
    console.log('Resident family_member_id.toString():', resident.family_member_id?.toString());
    console.log('Comparison result:', resident.family_member_id?.toString() === user.userId);
    
    if (user.role === Role.ADMIN || user.role === Role.STAFF) {
      console.log('=== ACCESS GRANTED (ADMIN/STAFF) ===');
      return resident;
    }
    
    if (user.role === Role.FAMILY) {
      // So sánh an toàn với nhiều cách khác nhau
      let familyMemberIdStr;
      if (typeof resident.family_member_id === 'object' && resident.family_member_id?._id) {
        familyMemberIdStr = resident.family_member_id._id.toString();
      } else {
        familyMemberIdStr = resident.family_member_id?.toString();
      }
      const userIdStr = user.userId?.toString();
      
      console.log('=== FAMILY ACCESS CHECK ===');
      console.log('Family member ID (string):', familyMemberIdStr);
      console.log('User ID (string):', userIdStr);
      console.log('Final comparison:', familyMemberIdStr === userIdStr);
      
      if (familyMemberIdStr === userIdStr) {
        console.log('=== ACCESS GRANTED (FAMILY) ===');
        return resident;
      } else {
        console.log('=== ACCESS DENIED (FAMILY) ===');
        throw new ForbiddenException('Bạn không có quyền xem resident này!');
      }
    }
    
    console.log('=== ACCESS DENIED (UNKNOWN ROLE) ===');
    throw new ForbiddenException('Bạn không có quyền xem resident này!');
  }

  // Debug endpoint để kiểm tra resident access
  @Get('debug/access/:residentId')
  async debugResidentAccess(@Param('residentId') residentId: string, @Req() req) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    
    console.log('=== DEBUG RESIDENT ACCESS ===');
    console.log('User role:', userRole);
    console.log('User ID:', userId);
    console.log('Resident ID:', residentId);
    
    try {
      const resident = await this.residentsService.findOne(residentId);
      if (!resident) {
        return { error: 'Resident not found' };
      }
      
      return {
        userRole,
        userId,
        resident: {
          id: (resident as any)._id?.toString(),
          full_name: resident.full_name,
          family_member_id: resident.family_member_id,
          family_member_id_type: typeof resident.family_member_id,
          family_member_id_str: typeof resident.family_member_id === 'object' && resident.family_member_id?._id ? 
            resident.family_member_id._id.toString() : (resident.family_member_id as any)?.toString()
        },
        comparison: {
          userId: userId,
          familyMemberId: typeof resident.family_member_id === 'object' && resident.family_member_id?._id ? 
            resident.family_member_id._id.toString() : (resident.family_member_id as any)?.toString(),
          isMatch: userId === (typeof resident.family_member_id === 'object' && resident.family_member_id?._id ? 
            resident.family_member_id._id.toString() : (resident.family_member_id as any)?.toString())
        }
      };
    } catch (error) {
      console.error('Error in debug resident access endpoint:', error);
      return { error: error.message };
    }
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
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
  @ApiOperation({ summary: 'Update a resident' })
  @ApiResponse({ status: 200, description: 'Resident updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateResidentDto: UpdateResidentDto,
  ) {
    if (file) {
      updateResidentDto.avatar = file.path || `uploads/${file.filename}`;
    }
    return this.residentsService.update(id, updateResidentDto);
  }

  @Patch(':id/avatar')
  @Roles(Role.ADMIN, Role.STAFF)
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
    description: 'Cập nhật avatar cho resident',
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Ảnh đại diện mới' },
      },
      required: ['avatar'],
    },
  })
  @ApiOperation({ summary: 'Update resident avatar' })
  @ApiResponse({ status: 200, description: 'Resident avatar updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  async updateAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }
    const updateResidentDto = { avatar: file.path || `uploads/${file.filename}` };
    return this.residentsService.update(id, updateResidentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a resident' })
  @ApiResponse({ status: 200, description: 'Resident deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  remove(@Param('id') id: string) {
    return this.residentsService.remove(id);
  }

  @Post(':id/assign-bed/:bed_id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Assign a bed to a resident' })
  @ApiResponse({
    status: 200,
    description: 'Bed assigned successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Resident or bed not found.' })
  assignBed(@Param('id') id: string, @Param('bed_id') bed_id: string) {
    return this.residentsService.assignBed(id, bed_id);
  }
}
