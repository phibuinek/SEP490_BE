import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResidentPhoto, ResidentPhotoDocument } from './resident-photo.schema';
import { CreateResidentPhotoDto } from './dto/create-resident-photo.dto';
import { UpdateResidentPhotoDto } from './dto/update-resident-photo.dto';
import * as fs from 'fs';
import * as path from 'path';

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
      serviceStartDate: data.serviceStartDate ? new Date(data.serviceStartDate) : undefined,
      residentId: data.residentId ? new Types.ObjectId(data.residentId) : undefined,
    });
    return photo.save();
  }

  async getPhotos(familyId: string) {
    return this.photoModel.find({ familyId }).sort({ uploadDate: -1 }).exec();
  }

  async getAllPhotos() {
    return this.photoModel.find().sort({ uploadDate: -1 }).exec();
  }

  async getPhotoById(id: string) {
    const photo = await this.photoModel.findById(id).exec();
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    return photo;
  }

  async updatePhoto(id: string, updateData: UpdateResidentPhotoDto) {
    const photo = await this.photoModel.findById(id).exec();
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const updateFields: any = {};
    if (updateData.caption !== undefined) updateFields.caption = updateData.caption;
    if (updateData.activityType !== undefined) updateFields.activityType = updateData.activityType;
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
    if (updateData.takenDate !== undefined) updateFields.takenDate = new Date(updateData.takenDate);
    if (updateData.staffNotes !== undefined) updateFields.staffNotes = updateData.staffNotes;
    if (updateData.relatedActivityId !== undefined) updateFields.relatedActivityId = updateData.relatedActivityId;
    if (updateData.serviceStartDate !== undefined) updateFields.serviceStartDate = new Date(updateData.serviceStartDate);
    if (updateData.residentId !== undefined) updateFields.residentId = new Types.ObjectId(updateData.residentId);

    return this.photoModel.findByIdAndUpdate(id, updateFields, { new: true }).exec();
  }

  async deletePhoto(id: string) {
    const photo = await this.photoModel.findById(id).exec();
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Delete the physical file
    try {
      const filePath = path.join(process.cwd(), photo.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await this.photoModel.findByIdAndDelete(id).exec();
    return { message: 'Photo deleted successfully' };
  }

  async getPhotosByFamilyId(familyId: string, residentsService: any) {
    // Lấy tất cả ảnh có familyId này
    return this.photoModel.find({ familyId }).sort({ uploadDate: -1 }).exec();
  }
} 