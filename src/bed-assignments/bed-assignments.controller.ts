import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { BedAssignmentsService } from './bed-assignments.service';
import { CreateBedAssignmentDto } from './dto/create-bed-assignment.dto';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResidentsService } from '../residents/residents.service';
import { Role } from '../common/enums/role.enum';

@ApiBearerAuth()
@ApiTags('BedAssignments')
@Controller('bed-assignments')
export class BedAssignmentsController {
  constructor(
    private readonly service: BedAssignmentsService,
    private readonly residentsService: ResidentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateBedAssignmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'bed_id', required: false })
  @ApiQuery({ name: 'resident_id', required: false })
  @ApiQuery({
    name: 'include_inactive',
    required: false,
    description: 'Include inactive assignments (admin/staff only)',
  })
  async findAll(
    @Req() req,
    @Query('bed_id') bed_id?: string,
    @Query('resident_id') resident_id?: string,
    @Query('include_inactive') include_inactive?: string,
  ) {
    const userRole = req.user?.role;
    if (userRole === Role.FAMILY) {
      throw new ForbiddenException('Family cannot view all bed assignments');
    }

    // STAFF/ADMIN: xem toàn bộ hoặc lọc theo bed_id/resident_id nếu có
    const includeInactive = include_inactive === 'true';
    if (includeInactive) {
      return this.service.findAllIncludingInactive(bed_id, resident_id);
    } else {
      return this.service.findAll(bed_id, resident_id, true); // activeOnly = true
    }
  }

  @Get('by-resident')
  @ApiQuery({ name: 'resident_id', required: true })
  async getByResident(@Query('resident_id') resident_id: string, @Req() req) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    console.log('=== BED ASSIGNMENT DEBUG ===');
    console.log('Bed assignment check - userRole:', userRole);
    console.log('Bed assignment check - userId:', userId);
    console.log('Bed assignment check - resident_id:', resident_id);
    console.log(
      'Bed assignment check - req.user:',
      JSON.stringify(req.user, null, 2),
    );

    if (userRole === Role.FAMILY) {
      // Kiểm tra resident này có thuộc về family không
      const resident = await this.residentsService.findOne(resident_id);
      console.log(
        'Bed assignment check - resident found:',
        resident ? 'yes' : 'no',
      );
      console.log(
        'Bed assignment check - resident:',
        JSON.stringify(resident, null, 2),
      );
      console.log(
        'Bed assignment check - resident.family_member_id:',
        resident?.family_member_id,
      );
      console.log(
        'Bed assignment check - resident.family_member_id.toString():',
        resident?.family_member_id?.toString(),
      );
      console.log('Bed assignment check - userId:', userId);
      console.log(
        'Bed assignment check - comparison result:',
        resident?.family_member_id?.toString() === userId,
      );

      if (!resident) {
        throw new ForbiddenException('Không tìm thấy thông tin cư dân');
      }

      // So sánh an toàn với nhiều cách khác nhau
      // resident.family_member_id có thể là object hoặc string
      let familyMemberIdStr;
      if (
        typeof resident.family_member_id === 'object' &&
        resident.family_member_id?._id
      ) {
        familyMemberIdStr = resident.family_member_id._id.toString();
      } else {
        familyMemberIdStr = resident.family_member_id?.toString();
      }
      const userIdStr = userId?.toString();

      console.log(
        'Bed assignment check - familyMemberIdStr:',
        familyMemberIdStr,
      );
      console.log('Bed assignment check - userIdStr:', userIdStr);
      console.log(
        'Bed assignment check - final comparison:',
        familyMemberIdStr === userIdStr,
      );

      if (familyMemberIdStr !== userIdStr) {
        console.log('=== PERMISSION DENIED ===');
        console.log('Family member ID:', familyMemberIdStr);
        console.log('User ID:', userIdStr);
        console.log('Resident ID:', resident_id);
        throw new ForbiddenException(
          'Bạn không có quyền xem bed assignment này',
        );
      }
    }

    console.log('=== PERMISSION GRANTED ===');
    // Gọi đúng hàm populate đủ thông tin
    return this.service.findByResidentId(resident_id);
  }

  @Patch(':id/unassign')
  unassign(@Param('id') id: string) {
    return this.service.unassign(id);
  }

  // Debug endpoint để kiểm tra residents của user family
  @Get('debug/family-residents')
  async debugFamilyResidents(@Req() req) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    console.log('=== DEBUG FAMILY RESIDENTS ===');
    console.log('User role:', userRole);
    console.log('User ID:', userId);

    if (userRole !== Role.FAMILY) {
      return { message: 'Chỉ user family mới có thể sử dụng endpoint này' };
    }

    try {
      const residents =
        await this.residentsService.findAllByFamilyMemberId(userId);
      console.log('Found residents:', residents.length);
      console.log('Residents:', JSON.stringify(residents, null, 2));

      return {
        userRole,
        userId,
        residentsCount: residents.length,
        residents: residents.map((r) => ({
          id: (r as any)._id?.toString(),
          full_name: r.full_name,
          family_member_id: r.family_member_id,
          family_member_id_str:
            typeof r.family_member_id === 'object' && r.family_member_id?._id
              ? r.family_member_id._id.toString()
              : (r.family_member_id as any)?.toString(),
        })),
      };
    } catch (error) {
      console.error('Error in debug endpoint:', error);
      return { error: error.message };
    }
  }

  // Debug endpoint để kiểm tra bed assignment cụ thể
  @Get('debug/bed-assignment/:residentId')
  async debugBedAssignment(
    @Param('residentId') residentId: string,
    @Req() req,
  ) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    console.log('=== DEBUG BED ASSIGNMENT ===');
    console.log('User role:', userRole);
    console.log('User ID:', userId);
    console.log('Resident ID:', residentId);

    try {
      const resident = await this.residentsService.findOne(residentId);
      if (!resident) {
        return { error: 'Resident not found' };
      }

      const bedAssignments = await this.service.findByResidentId(residentId);

      return {
        userRole,
        userId,
        resident: {
          id: (resident as any)._id?.toString(),
          full_name: resident.full_name,
          family_member_id: resident.family_member_id,
          family_member_id_type: typeof resident.family_member_id,
          family_member_id_str:
            typeof resident.family_member_id === 'object' &&
            resident.family_member_id?._id
              ? resident.family_member_id._id.toString()
              : (resident.family_member_id as any)?.toString(),
        },
        bedAssignments: bedAssignments,
        comparison: {
          userId: userId,
          familyMemberId:
            typeof resident.family_member_id === 'object' &&
            resident.family_member_id?._id
              ? resident.family_member_id._id.toString()
              : (resident.family_member_id as any)?.toString(),
          isMatch:
            userId ===
            (typeof resident.family_member_id === 'object' &&
            resident.family_member_id?._id
              ? resident.family_member_id._id.toString()
              : (resident.family_member_id as any)?.toString()),
        },
      };
    } catch (error) {
      console.error('Error in debug bed assignment endpoint:', error);
      return { error: error.message };
    }
  }

  // Admin endpoints for bed assignment approval
  @Get('admin/pending')
  @ApiBearerAuth()
  async getPendingBedAssignments(@Req() req) {
    const userRole = req.user?.role;
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can view pending bed assignments');
    }
    return this.service.getPendingBedAssignments();
  }

  @Patch('admin/:id/approve')
  @ApiBearerAuth()
  async approveBedAssignment(@Param('id') id: string, @Req() req) {
    const userRole = req.user?.role;
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can approve bed assignments');
    }
    return this.service.approveBedAssignment(id, req.user.userId);
  }

  @Patch('admin/:id/reject')
  @ApiBearerAuth()
  async rejectBedAssignment(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req) {
    const userRole = req.user?.role;
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can reject bed assignments');
    }
    return this.service.rejectBedAssignment(id, req.user.userId, body.reason);
  }

  @Patch('admin/:id/activate')
  @ApiBearerAuth()
  async activateBedAssignment(@Param('id') id: string, @Req() req) {
    const userRole = req.user?.role;
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can activate bed assignments');
    }
    return this.service.activateBedAssignment(id);
  }

  @Post('activate-completed')
  @UseGuards(JwtAuthGuard)
  async activateCompletedAssignments(@Req() req: any) {
    const userRole = req.user?.role;
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can activate completed assignments');
    }
    await this.service.activateCompletedAssignmentsByAdmissionDate();
    return { message: 'Completed assignments activated successfully' };
  }

  @Get('by-status/:status')
  @UseGuards(JwtAuthGuard)
  async getAssignmentsByStatus(
    @Param('status') status: string,
    @Req() req: any,
  ) {
    const userRole = req.user?.role;
    if (userRole !== Role.ADMIN && userRole !== Role.STAFF) {
      throw new ForbiddenException('Only admin and staff can view assignments by status');
    }
    return this.service.getAssignmentsByStatus(status);
  }
}
