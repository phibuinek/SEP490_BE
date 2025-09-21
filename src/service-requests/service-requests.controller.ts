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
    description: 'Dữ liệu yêu cầu thay đổi',
    examples: {
      care_plan_change: {
        summary: 'Thay đổi gói chăm sóc',
        value: {
          resident_id: '507f1f77bcf86cd799439011',
          family_member_id: '507f1f77bcf86cd799439012',
          request_type: 'care_plan_change',
          target_service_package_id: '507f1f77bcf86cd799439013',
          note: 'Muốn nâng cấp lên gói chăm sóc cao cấp',
          emergencyContactName: 'Nguyễn Văn A',
          emergencyContactPhone: '0900000000',
          medicalNote: 'Tiền sử cao huyết áp'
        }
      },
      service_date_change: {
        summary: 'Thay đổi thời gian dịch vụ',
        value: {
          resident_id: '507f1f77bcf86cd799439011',
          family_member_id: '507f1f77bcf86cd799439012',
          request_type: 'service_date_change',
          new_start_date: '2025-01-01T00:00:00.000Z',
          new_end_date: '2026-01-01T00:00:00.000Z',
          note: 'Gia hạn dịch vụ thêm 12 tháng',
          emergencyContactName: 'Nguyễn Văn A',
          emergencyContactPhone: '0900000000'
        }
      },
      room_change: {
        summary: 'Đổi phòng',
        value: {
          resident_id: '507f1f77bcf86cd799439011',
          family_member_id: '507f1f77bcf86cd799439012',
          request_type: 'room_change',
          target_room_id: '507f1f77bcf86cd799439014',
          note: 'Muốn đổi sang phòng yên tĩnh hơn',
          emergencyContactName: 'Nguyễn Văn A',
          emergencyContactPhone: '0900000000'
        }
      }
    }
  })
  create(@Body() dto: CreateServiceRequestDto, @Req() req: any) {
    return this.service.create(dto, req.user);
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
