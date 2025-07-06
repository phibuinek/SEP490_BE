import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, Query, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ResidentPhotosService } from './resident-photos.service';
import { CreateResidentPhotoDto } from './dto/create-resident-photo.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('ResidentPhotos')
@ApiBearerAuth()
@Controller('resident-photos')
export class ResidentPhotosController {
  constructor(private readonly service: ResidentPhotosService) {}

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
        residentId: { type: 'string' },
        caption: { type: 'string' },
        activityType: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        takenDate: { type: 'string', format: 'date-time' },
        staffNotes: { type: 'string' },
        relatedActivityId: { type: 'string' },
      },
      required: ['file', 'residentId'],
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
  @ApiQuery({ name: 'residentId', required: true })
  async getPhotos(@Query('residentId') residentId: string) {
    return this.service.getPhotos(residentId);
  }
} 