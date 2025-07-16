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
      family_id: data.family_id,
      uploaded_by: data.uploaded_by,
      file_name: data.file_name,
      file_path: data.file_path,
      file_type: data.file_type,
      file_size: data.file_size,
      caption: data.caption,
      activity_type: data.activity_type,
      tags: data.tags,
      upload_date: new Date(),
      taken_date: data.taken_date ? new Date(data.taken_date) : undefined,
      staff_notes: data.staff_notes,
      related_activity_id: data.related_activity_id,
      service_start_date: data.service_start_date
        ? new Date(data.service_start_date)
        : undefined,
      resident_id: data.resident_id
        ? new Types.ObjectId(data.resident_id)
        : undefined,
    });
    return photo.save();
  }

  async getPhotos(family_id: string) {
    return this.photoModel.find({ family_id }).sort({ upload_date: -1 }).exec();
  }

  async getAllPhotos() {
    return this.photoModel.find().sort({ upload_date: -1 }).exec();
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
    if (updateData.caption !== undefined)
      updateFields.caption = updateData.caption;
    if (updateData.activity_type !== undefined)
      updateFields.activity_type = updateData.activity_type;
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags;
    if (updateData.taken_date !== undefined)
      updateFields.taken_date = new Date(updateData.taken_date);
    if (updateData.staff_notes !== undefined)
      updateFields.staff_notes = updateData.staff_notes;
    if (updateData.related_activity_id !== undefined)
      updateFields.related_activity_id = updateData.related_activity_id;
    if (updateData.service_start_date !== undefined)
      updateFields.service_start_date = new Date(updateData.service_start_date);
    if (updateData.resident_id !== undefined)
      updateFields.resident_id = new Types.ObjectId(updateData.resident_id);

    return this.photoModel
      .findByIdAndUpdate(id, updateFields, { new: true })
      .exec();
  }

  async deletePhoto(id: string) {
    const photo = await this.photoModel.findById(id).exec();
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Delete the physical file
    try {
      const file_path = path.join(process.cwd(), photo.file_path);
      if (fs.existsSync(file_path)) {
        fs.unlinkSync(file_path);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await this.photoModel.findByIdAndDelete(id).exec();
    return { message: 'Photo deleted successfully' };
  }

  async getPhotosByFamilyId(family_id: string, residentsService: any) {
    // Lấy tất cả ảnh có family_id này
    return this.photoModel.find({ family_id }).sort({ upload_date: -1 }).exec();
  }
}
