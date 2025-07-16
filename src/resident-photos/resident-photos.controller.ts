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
        family_id: { type: 'string' },
        caption: { type: 'string' },
        activity_type: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        taken_date: { type: 'string', format: 'date-time' },
        staff_notes: { type: 'string' },
        related_activity_id: { type: 'string' },
        service_start_date: { type: 'string', format: 'date-time' },
        resident_id: { type: 'string' },
      },
      required: ['file', 'family_id'],
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
    name: 'family_id',
    required: false,
    description:
      'Filter by family ID. If not provided, returns all photos (staff only)',
  })
  async getPhotos(@Query('family_id') family_id: string, @Req() req) {
    // If family_id is provided, return photos for that family
    if (family_id) {
      return this.service.getPhotos(family_id);
    }
    // Nếu không có family_id, kiểm tra role dạng string
    const userRole = req.user?.role;
    if (userRole !== Role.STAFF && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only staff and admin can view all photos',
      );
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
