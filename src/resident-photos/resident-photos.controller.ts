import { Controller, Post, Get, Put, Delete, UseInterceptors, UploadedFile, Body, Query, Req, Param, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
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
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        familyId: { type: 'string' },
        caption: { type: 'string' },
        activityType: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        takenDate: { type: 'string', format: 'date-time' },
        staffNotes: { type: 'string' },
        relatedActivityId: { type: 'string' },
        serviceStartDate: { type: 'string', format: 'date-time' },
      },
      required: ['file', 'familyId'],
    },
  })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateResidentPhotoDto,
    @Req() req
  ) {
    // Giả sử req.user._id là id người upload
    const uploadedBy = req.user?.userId || 'unknown';
    console.log('Uploaded file:', file);
    const filePath = file.path || `uploads/${file.filename}`;
    return this.service.uploadPhoto({
      ...body,
      fileName: file.originalname,
      filePath,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy,
    });
  }

  @Get()
  @ApiQuery({ name: 'familyId', required: false, description: 'Filter by family ID. If not provided, returns all photos (staff only)' })
  async getPhotos(@Query('familyId') familyId: string, @Req() req) {
    // If familyId is provided, return photos for that family
    if (familyId) {
      return this.service.getPhotos(familyId);
    }
    
    // If no familyId provided, check if user is staff
    if (req.user?.role !== Role.STAFF && req.user?.role !== Role.ADMIN) {
      throw new Error('Access denied. Only staff can view all photos.');
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
    @Body() updateData: UpdateResidentPhotoDto
  ) {
    return this.service.updatePhoto(id, updateData);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Photo ID' })
  async deletePhoto(@Param('id') id: string) {
    return this.service.deletePhoto(id);
  }
} 