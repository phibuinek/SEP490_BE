import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { CarePlanChangeRequestDto } from './dto/care-plan-change-request.dto';
import { ServiceDateChangeRequestDto } from './dto/service-date-change-request.dto';
import { RoomChangeRequestDto } from './dto/room-change-request.dto';

@ApiBearerAuth()
@Controller('service-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Post()
  @Roles(Role.FAMILY)
  @ApiOperation({ summary: 'Tạo yêu cầu thay đổi dịch vụ (Family only)' })
  @ApiResponse({ status: 201, description: 'Yêu cầu được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo yêu cầu.' })
  @ApiBody({
    description: 'Dữ liệu yêu cầu thay đổi dịch vụ',
    examples: {
      care_plan_change: {
        summary: '🔄 Thay đổi gói chăm sóc (CARE_PLAN_CHANGE)',
        description: 'User tạo care plan assignment và bed assignment mới, sau đó gửi request với IDs của chúng',
        value: {
          resident_id: '507f1f77bcf86cd799439011',
          family_member_id: '507f1f77bcf86cd799439012',
          request_type: 'care_plan_change',
          note: 'Cần thay đổi gói dịch vụ do tình trạng sức khỏe của cư dân',
          target_care_plan_assignment_id: '507f1f77bcf86cd799439013',
          target_bed_assignment_id: '507f1f77bcf86cd799439014',
          emergencyContactName: 'Nguyễn Văn A',
          emergencyContactPhone: '0901234567',
          medicalNote: 'Cư dân cần chăm sóc đặc biệt do bệnh tim'
        }
      },
      service_date_change: {
        summary: '📅 Gia hạn dịch vụ (SERVICE_DATE_CHANGE)',
        description: 'Gia hạn thời gian sử dụng dịch vụ cho care plan assignment và bed assignment hiện tại',
        value: {
          resident_id: '507f1f77bcf86cd799439011',
          family_member_id: '507f1f77bcf86cd799439012',
          request_type: 'service_date_change',
          current_care_plan_assignment_id: '507f1f77bcf86cd799439015',
          current_bed_assignment_id: '507f1f77bcf86cd799439016',
          new_end_date: '2024-12-31T23:59:59.000Z',
          emergencyContactName: 'Nguyễn Văn A',
          emergencyContactPhone: '0901234567',
          medicalNote: 'Cư dân cần chăm sóc đặc biệt do bệnh tim'
        }
      },
      room_change: {
        summary: '🏠 Đổi phòng (ROOM_CHANGE)',
        description: 'User tạo bed assignment mới cho phòng mới, sau đó gửi request với ID của nó',
        value: {
          resident_id: '507f1f77bcf86cd799439011',
          family_member_id: '507f1f77bcf86cd799439012',
          request_type: 'room_change',
          note: 'Cần chuyển phòng do vấn đề về tiếng ồn',
          target_bed_assignment_id: '507f1f77bcf86cd799439014',
          emergencyContactName: 'Nguyễn Văn A',
          emergencyContactPhone: '0901234567',
          medicalNote: 'Cư dân cần chăm sóc đặc biệt do bệnh tim'
        }
      }
    }
  })
  create(@Body() dto: CreateServiceRequestDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }

  @Post('care-plan-change')
  @Roles(Role.FAMILY)
  @ApiOperation({ 
    summary: 'Tạo yêu cầu thay đổi gói chăm sóc',
    description: 'Tạo yêu cầu thay đổi gói chăm sóc với care plan assignment và bed assignment mới'
  })
  @ApiResponse({ status: 201, description: 'Yêu cầu thay đổi gói chăm sóc được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo yêu cầu.' })
  @ApiBody({ type: CarePlanChangeRequestDto })
  createCarePlanChangeRequest(@Body() dto: CarePlanChangeRequestDto, @Req() req: any) {
    const fullDto: CreateServiceRequestDto = {
      ...dto,
      request_type: 'care_plan_change' as any
    };
    return this.service.create(fullDto, req.user);
  }

  @Post('service-date-change')
  @Roles(Role.FAMILY)
  @ApiOperation({ 
    summary: 'Tạo yêu cầu gia hạn dịch vụ',
    description: 'Tạo yêu cầu gia hạn thời gian sử dụng dịch vụ'
  })
  @ApiResponse({ status: 201, description: 'Yêu cầu gia hạn dịch vụ được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo yêu cầu.' })
  @ApiBody({ type: ServiceDateChangeRequestDto })
  createServiceDateChangeRequest(@Body() dto: ServiceDateChangeRequestDto, @Req() req: any) {
    const fullDto: CreateServiceRequestDto = {
      ...dto,
      request_type: 'service_date_change' as any
    };
    return this.service.create(fullDto, req.user);
  }

  @Post('room-change')
  @Roles(Role.FAMILY)
  @ApiOperation({ 
    summary: 'Tạo yêu cầu đổi phòng',
    description: 'Tạo yêu cầu đổi phòng với bed assignment mới'
  })
  @ApiResponse({ status: 201, description: 'Yêu cầu đổi phòng được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo yêu cầu.' })
  @ApiBody({ type: RoomChangeRequestDto })
  createRoomChangeRequest(@Body() dto: RoomChangeRequestDto, @Req() req: any) {
    const fullDto: CreateServiceRequestDto = {
      ...dto,
      request_type: 'room_change' as any
    };
    return this.service.create(fullDto, req.user);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách tất cả yêu cầu (Admin only)' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu cầu được lấy thành công.' })
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get('my')
  @Roles(Role.FAMILY)
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu của gia đình (Family only)' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu cầu của gia đình được lấy thành công.' })
  findMyRequests(@Req() req: any) {
    return this.service.findAllByFamily(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.FAMILY)
  @ApiOperation({ summary: 'Lấy chi tiết yêu cầu theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết yêu cầu được lấy thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Duyệt yêu cầu và thực hiện thay đổi (Admin only)' })
  @ApiResponse({ status: 200, description: 'Yêu cầu được duyệt và thực hiện thành công.' })
  @ApiResponse({ status: 400, description: 'Không thể thực hiện thay đổi.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu.' })
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Từ chối yêu cầu (Admin only)' })
  @ApiResponse({ status: 200, description: 'Yêu cầu được từ chối thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu.' })
  reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.reject(id, body.reason);
  }
}
