import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { ResidentsService } from '../residents/residents.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@ApiTags('Vital Signs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vital-signs')
export class VitalSignsController {
  constructor(
    private readonly service: VitalSignsService,
    private readonly residentsService: ResidentsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new vital sign record' })
  create(@Body() dto: CreateVitalSignDto, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all vital sign records' })
  findAll() {
    return this.service.findAll();
  }

  @Get('resident/:resident_id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get all vital signs by resident ID' })
  async findAllByResidentId(
    @Param('resident_id') resident_id: string,
    @Req() req,
  ) {
    const user = req.user;

    console.log('=== VITAL SIGNS ACCESS DEBUG ===');
    console.log('Resident ID:', resident_id);
    console.log('User role:', user.role);
    console.log('User ID:', user.userId);

    // Lấy thông tin resident để kiểm tra quyền
    const resident = await this.residentsService.findOne(resident_id);
    console.log('Resident found:', resident ? 'yes' : 'no');
    console.log('Resident family_member_id:', resident?.family_member_id);

    if (user?.role === Role.ADMIN || user?.role === Role.STAFF) {
      console.log('=== ACCESS GRANTED (ADMIN/STAFF) ===');
      return this.service.findAllByResidentId(resident_id);
    }

    if (user?.role === Role.FAMILY) {
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
        return this.service.findAllByResidentId(resident_id);
      } else {
        console.log('=== ACCESS DENIED (FAMILY) ===');
      }
    }

    console.log('=== ACCESS DENIED ===');
    throw new ForbiddenException(
      'Bạn không có quyền xem vital signs của resident này!',
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get a vital sign record by ID' })
  async findOne(@Param('id') id: string, @Req() req) {
    const vitalSign = await this.service.findOne(id);
    const user = req.user;

    // Lấy thông tin resident để kiểm tra quyền
    const resident = await this.residentsService.findOne(
      vitalSign.resident_id.toString(),
    );

    if (user?.role === Role.ADMIN || user?.role === Role.STAFF) {
      return vitalSign;
    }

    if (user?.role === Role.FAMILY) {
      // So sánh an toàn với nhiều cách khác nhau
      let familyMemberIdStr;
      if (typeof resident.family_member_id === 'object' && resident.family_member_id?._id) {
        familyMemberIdStr = resident.family_member_id._id.toString();
      } else {
        familyMemberIdStr = resident.family_member_id?.toString();
      }
      const userIdStr = user.userId?.toString();
      
      if (familyMemberIdStr === userIdStr) {
        return vitalSign;
      }
    }

    throw new ForbiddenException('Bạn không có quyền xem vital sign này!');
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a vital sign record' })
  update(@Param('id') id: string, @Body() dto: UpdateVitalSignDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a vital sign record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // Debug endpoint để kiểm tra vital signs access
  @Get('debug/access/:residentId')
  async debugVitalSignsAccess(@Param('residentId') residentId: string, @Req() req) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;
    
    console.log('=== DEBUG VITAL SIGNS ACCESS ===');
    console.log('User role:', userRole);
    console.log('User ID:', userId);
    console.log('Resident ID:', residentId);
    
    try {
      const resident = await this.residentsService.findOne(residentId);
      if (!resident) {
        return { error: 'Resident not found' };
      }
      
      const vitalSigns = await this.service.findAllByResidentId(residentId);
      
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
        vitalSignsCount: Array.isArray(vitalSigns) ? vitalSigns.length : 0,
        comparison: {
          userId: userId,
          familyMemberId: typeof resident.family_member_id === 'object' && resident.family_member_id?._id ? 
            resident.family_member_id._id.toString() : (resident.family_member_id as any)?.toString(),
          isMatch: userId === (typeof resident.family_member_id === 'object' && resident.family_member_id?._id ? 
            resident.family_member_id._id.toString() : (resident.family_member_id as any)?.toString())
        }
      };
    } catch (error) {
      console.error('Error in debug vital signs access endpoint:', error);
      return { error: error.message };
    }
  }
}
