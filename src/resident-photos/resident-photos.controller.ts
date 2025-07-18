import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Req,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ResidentPhotosService } from './resident-photos.service';
import { CreateResidentPhotoDto } from './dto/create-resident-photo.dto';
import { UpdateResidentPhotoDto } from './dto/update-resident-photo.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ResidentsService } from '../residents/residents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('ResidentPhotos')
@ApiBearerAuth()
@Controller('resident-photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentPhotosController {
  constructor(
    private readonly service: ResidentPhotosService,
    private readonly residentsService: ResidentsService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload photo with metadata',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        resident_id: { type: 'string', description: 'ID của người cao tuổi' },
        caption: { type: 'string', description: 'Mô tả về ảnh' },
        activity_type: { 
          type: 'string', 
          description: 'Loại hoạt động trong ảnh'
        },
        tags: { type: 'array', items: { type: 'string' }, description: 'Các tag cho ảnh' },
        taken_date: { type: 'string', format: 'date-time', description: 'Ngày chụp ảnh' },
        staff_notes: { type: 'string', description: 'Ghi chú của nhân viên' },
        related_activity_id: { type: 'string', description: 'ID của hoạt động liên quan (nếu có)' },
      },
      required: ['file', 'resident_id'],
    },
  })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateResidentPhotoDto,
    @Req() req,
  ) {
    // Giả sử req.user._id là id người upload
    const uploaded_by = req.user?.userId || 'unknown';
    console.log('Uploaded file:', file);
    const file_path = file.path || `uploads/${file.filename}`;
    return this.service.uploadPhoto({
      ...body,
      file_name: file.originalname,
      file_path,
      file_type: file.mimetype,
      file_size: file.size,
      uploaded_by,
    });
  }

  @Get()
  @ApiQuery({
    name: 'family_member_id',
    required: false,
    description: 'Filter by family member ID. If not provided, returns all photos (staff/admin only)',
  })
  async getPhotos(@Query('family_member_id') family_member_id: string, @Req() req) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    if (family_member_id) {
      // Nếu là FAMILY thì chỉ cho xem đúng family_member_id của mình
      if (userRole === Role.FAMILY && family_member_id !== userId) {
        throw new ForbiddenException('Bạn chỉ được xem ảnh của gia đình mình!');
      }
      return this.service.getPhotos(family_member_id);
    }

    // Nếu không truyền family_member_id, chỉ staff/admin được xem tất cả
    if (userRole !== Role.STAFF && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only staff and admin can view all photos');
    }
    return this.service.getAllPhotos();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Photo ID' })
  async getPhotoById(@Param('id') id: string) {
    return this.service.getPhotoById(id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Photo ID' })
  @ApiBody({ type: UpdateResidentPhotoDto })
  async updatePhoto(
    @Param('id') id: string,
    @Body() updateData: UpdateResidentPhotoDto,
  ) {
    return this.service.updatePhoto(id, updateData);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Photo ID' })
  async deletePhoto(@Param('id') id: string) {
    return this.service.deletePhoto(id);
  }
}
