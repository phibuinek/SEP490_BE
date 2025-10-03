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
import { Express } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse,
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
      fileFilter: (req, file, cb) => {
        // Cho phép upload ảnh và video
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image and video files are allowed'), false);
        }
      },
      limits: {
        // 5MB cho ảnh, tăng hạn mức chung để hỗ trợ video; middleware phía trước nên kiểm soát thêm nếu cần
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload photo/video with metadata',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        resident_id: { type: 'string', description: 'ID của người cao tuổi' },
        caption: { type: 'string', description: 'Mô tả về media' },
        activity_type: {
          type: 'string',
          description: 'Loại hoạt động trong media',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Các tag cho media',
        },
        taken_date: {
          type: 'string',
          format: 'date-time',
          description: 'Ngày chụp/quay',
        },
        staff_notes: { type: 'string', description: 'Ghi chú của nhân viên' },
        related_activity_id: {
          type: 'string',
          description: 'ID của hoạt động liên quan (nếu có)',
        },
      },
      required: ['file', 'resident_id'],
    },
  })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or data.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateResidentPhotoDto,
    @Req() req,
  ) {
    try {
      console.log('Upload photo request - File:', file);
      console.log('Upload photo request - Body:', body);
      console.log('Upload photo request - User:', req.user);

      // Validate file
      if (!file) {
        throw new Error('File is required');
      }

      // Validate resident_id
      if (!body.resident_id) {
        throw new Error('resident_id is required');
      }

      // Validate user
      if (!req.user?.userId) {
        throw new Error('User not authenticated');
      }

      const uploaded_by = req.user.userId;
      console.log('Uploaded by user ID:', uploaded_by);

      // Store file path in database (always use uploads/ prefix)
      // Actual file location is handled by multer and static serving
      const file_path = `uploads/${file.filename}`;
      console.log('File path for DB:', file_path);
      console.log('File filename:', file.filename);

      const uploadData = {
        ...body,
        file_name: file.originalname,
        file_path,
        file_type: file.mimetype,
        file_size: file.size,
        uploaded_by,
      };

      console.log('Upload data to service:', uploadData);

      const result = await this.service.uploadPhoto(uploadData);
      console.log('Upload result:', result);

      return result;
    } catch (error) {
      console.error('Error in uploadPhoto controller:', error);
      throw error;
    }
  }

  @Get()
  @ApiQuery({ name: 'family_member_id', required: false })
  async getPhotos(
    @Query('family_member_id') family_member_id: string,
    @Req() req,
  ) {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    console.log('Get photos request - User role:', userRole);
    console.log('Get photos request - User ID:', userId);
    console.log('Get photos request - Family member ID:', family_member_id);

    if (userRole === Role.FAMILY) {
      // Family chỉ có thể xem photos của residents thuộc về họ
      if (!family_member_id || family_member_id !== userId) {
        throw new ForbiddenException(
          'Bạn chỉ có thể xem photos của người thân của mình',
        );
      }
      // Family bắt buộc phải có family_member_id
      return this.service.getPhotos(family_member_id);
    }

    // STAFF/ADMIN: xem tất cả hoặc lọc theo family_member_id nếu có
    if (family_member_id) {
      return this.service.getPhotos(family_member_id);
    }
    return this.service.getAllPhotos();
  }

  @Get('by-resident/:id')
  async getPhotosByResidentId(@Param('id') resident_id: string, @Req() req) {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.userId;

      console.log('Get photos by resident request - Resident ID:', resident_id);
      console.log('Get photos by resident request - User role:', userRole);
      console.log('Get photos by resident request - User ID:', userId);

      if (userRole === Role.FAMILY) {
        // Kiểm tra resident này có thuộc về family không
        const resident = await this.residentsService.findOne(resident_id);
        console.log('Resident found:', resident);
        if (!resident || resident.family_member_id.toString() !== userId) {
          throw new ForbiddenException(
            'Bạn không có quyền xem photos của resident này',
          );
        }
      }

      const photos = await this.service.findByResidentId(resident_id);
      console.log('Photos found for resident:', photos.length);
      return photos;
    } catch (error) {
      console.error('Error in getPhotosByResidentId:', error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error('Internal server error');
    }
  }

  @Get(':id')
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

  @Get('debug/all-photos')
  @Roles(Role.ADMIN, Role.STAFF)
  async debugAllPhotos() {
    console.log('Debug: Getting all photos from database');
    return this.service.getAllPhotos();
  }

  @Get('debug/photos-by-resident/:id')
  @Roles(Role.ADMIN, Role.STAFF)
  async debugPhotosByResident(@Param('id') resident_id: string) {
    console.log('Debug: Getting photos for resident:', resident_id);
    return this.service.findByResidentId(resident_id);
  }

  @Get('debug/video-files')
  @Roles(Role.ADMIN, Role.STAFF)
  async debugVideoFiles() {
    console.log('Debug: Getting all video files');
    const allPhotos = await this.service.getAllPhotos();
    const videoFiles = allPhotos.filter(photo => photo.is_video);
    console.log('Video files found:', videoFiles.length);
    return videoFiles;
  }

  @Get('debug/file-info/:id')
  @Roles(Role.ADMIN, Role.STAFF)
  async debugFileInfo(@Param('id') photo_id: string) {
    console.log('Debug: Getting file info for photo:', photo_id);
    const photo = await this.service.getPhotoById(photo_id);
    return {
      ...photo.toObject(),
      file_url: this.service.getFileUrl(photo.file_path),
      is_video: photo.file_type?.startsWith('video/') || false,
      file_exists: require('fs').existsSync(photo.file_path),
    };
  }

  @Get('debug/fix-file-paths')
  @Roles(Role.ADMIN, Role.STAFF)
  async fixFilePaths() {
    console.log('Debug: Fixing file paths in database');
    const result = await this.service.fixFilePaths();
    return result;
  }

  @Get('debug/test-file-url/:id')
  @Roles(Role.ADMIN, Role.STAFF)
  async testFileUrl(@Param('id') photo_id: string) {
    console.log('Debug: Testing file URL for photo:', photo_id);
    const photo = await this.service.getPhotoById(photo_id);
    
    const fileUrl = this.service.getFileUrl(photo.file_path);
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    
    return {
      photo_id,
      file_path_in_db: photo.file_path,
      generated_file_url: fileUrl,
      is_production: isProd,
      expected_actual_location: isProd ? `/tmp/${photo.file_path}` : `./${photo.file_path}`,
      file_exists: require('fs').existsSync(isProd ? `/tmp/${photo.file_path}` : `./${photo.file_path}`)
    };
  }
}
