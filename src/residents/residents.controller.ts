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
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { ResidentStatus } from './schemas/resident.schema';

@ApiTags('residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
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
    description: 'Tạo resident mới, có thể upload avatar',
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
        full_name: { type: 'string' },
        gender: { type: 'string' },
        date_of_birth: { type: 'string', format: 'date' },
        family_member_id: { type: 'string' },
        relationship: { type: 'string' },
        medical_history: { type: 'string' },
        current_medications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              medication_name: { type: 'string' },
              dosage: { type: 'string' },
              frequency: { type: 'string' },
            },
          },
        },
        allergies: { type: 'array', items: { type: 'string' } },
        emergency_contact: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            relationship: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Create a new resident' })
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createResidentDto: CreateResidentDto,
  ) {
    if (file) {
      createResidentDto.avatar = file.path || `uploads/${file.filename}`;
    }
    return this.residentsService.create(createResidentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all residents' })
  findAll() {
    return this.residentsService.findAll();
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
    return this.residentsService.findAcceptedResidentsByFamily(familyMemberId);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all pending residents' })
  findPendingResidents() {
    return this.residentsService.findPendingResidents();
  }

  @Get('accepted')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all accepted residents' })
  findAllAccepted() {
    return this.residentsService.findAllAccepted();
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
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update resident status (accept/reject)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['accepted', 'rejected'],
          description: 'Status to update (accepted or rejected)'
        }
      },
      required: ['status']
    }
  })
  @ApiResponse({ status: 200, description: 'Resident status updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid status.' })
  @ApiResponse({ status: 404, description: 'Resident not found.' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ResidentStatus.ACCEPTED | ResidentStatus.REJECTED,
  ) {
    return this.residentsService.updateStatus(id, status);
  }
}
