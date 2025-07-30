import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CareNotesService } from './care-notes.service';
import { CreateAssessmentDto } from './dto/create-care-note.dto';
import { UpdateCareNoteDto } from './dto/update-care-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('Assessments')
@ApiBearerAuth()
@Controller('assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN, Role.FAMILY)
export class AssessmentsController {
  constructor(private readonly service: CareNotesService) {}

  @Post()
  @ApiBody({ type: CreateAssessmentDto })
  @UsePipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  async create(@Body() dto: CreateAssessmentDto, @Req() req) {
    try {
      console.log('=== CREATING ASSESSMENT ===');
      console.log('DTO received:', JSON.stringify(dto, null, 2));
      console.log('User ID:', req.user?.userId);
      
      const conducted_by = dto.conducted_by || req.user?.userId;
      
      if (!conducted_by) {
        throw new HttpException(
          'Không tìm thấy thông tin người thực hiện',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.service.create({ ...dto, conducted_by });
      console.log('Assessment created successfully:', (result as any)._id);
      return result;
    } catch (error) {
      console.error('Error creating assessment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Lỗi tạo đánh giá',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      console.log('=== GETTING ASSESSMENT BY ID ===');
      console.log('Assessment ID:', id);
      
      const result = await this.service.findOne(id);
      console.log('Assessment found:', result._id);
      return result;
    } catch (error) {
      console.error('Error getting assessment by ID:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Lỗi lấy thông tin đánh giá',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async findAll(@Query('resident_id') resident_id: string, @Req() req) {
    const user = req.user;
    
    // If staff, only return care notes for assigned residents
    if (user?.role === Role.STAFF) {
      return this.service.findAllByStaffId(user.userId);
    }
    
    // If specific resident_id is provided, return care notes for that resident
    if (resident_id) {
      return this.service.findAll(resident_id);
    }
    
    // For admin, return all care notes (you might want to add a separate endpoint for this)
    return this.service.findAll(resident_id);
  }

  @Put(':id')
  @ApiBody({ type: UpdateCareNoteDto })
  @UsePipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  async update(@Param('id') id: string, @Body() dto: UpdateCareNoteDto) {
    try {
      console.log('=== UPDATING ASSESSMENT VIA CONTROLLER ===');
      console.log('Assessment ID:', id);
      console.log('Update DTO:', JSON.stringify(dto, null, 2));
      
      const result = await this.service.update(id, dto);
      console.log('Assessment updated successfully via controller:', result._id);
      return result;
    } catch (error) {
      console.error('Error updating assessment via controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Lỗi cập nhật đánh giá',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiBody({ type: UpdateCareNoteDto })
  @UsePipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  async patch(@Param('id') id: string, @Body() dto: UpdateCareNoteDto) {
    try {
      console.log('=== PATCHING ASSESSMENT VIA CONTROLLER ===');
      console.log('Assessment ID:', id);
      console.log('Patch DTO:', JSON.stringify(dto, null, 2));
      
      const result = await this.service.patch(id, dto);
      console.log('Assessment patched successfully via controller:', result._id);
      return result;
    } catch (error) {
      console.error('Error patching assessment via controller:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Lỗi cập nhật đánh giá',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Delete an assessment record' })
  async remove(@Param('id') id: string) {
    try {
      console.log('=== DELETING ASSESSMENT ===');
      console.log('Assessment ID:', id);
      
      const result = await this.service.remove(id);
      console.log('Assessment deleted successfully:', id);
      return result;
    } catch (error) {
      console.error('Error deleting assessment:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Lỗi xóa đánh giá',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
