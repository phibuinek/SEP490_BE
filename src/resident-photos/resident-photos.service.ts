import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResidentPhoto, ResidentPhotoDocument } from './resident-photo.schema';
import { CreateResidentPhotoDto } from './dto/create-resident-photo.dto';

@Injectable()
export class ResidentPhotosService {
  constructor(
    @InjectModel(ResidentPhoto.name)
    private photoModel: Model<ResidentPhotoDocument>,
  ) {}

  async uploadPhoto(data: any) {
    const photo = new this.photoModel({
      familyId: data.familyId,
      uploadedBy: data.uploadedBy,
      fileName: data.fileName,
      filePath: data.filePath,
      fileType: data.fileType,
      fileSize: data.fileSize,
      caption: data.caption,
      activityType: data.activityType,
      tags: data.tags,
      uploadDate: new Date(),
      takenDate: data.takenDate ? new Date(data.takenDate) : undefined,
      staffNotes: data.staffNotes,
      relatedActivityId: data.relatedActivityId,
    });
    return photo.save();
  }

  async getPhotos(familyId: string) {
    return this.photoModel.find({ familyId }).sort({ uploadDate: -1 }).exec();
  }

  async getPhotosByFamilyId(familyId: string, residentsService: any) {
    // Lấy tất cả ảnh có familyId này
    return this.photoModel.find({ familyId }).sort({ uploadDate: -1 }).exec();
  }
} 