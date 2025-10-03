import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResidentPhoto, ResidentPhotoDocument } from './resident-photo.schema';
import {
  Resident,
  ResidentDocument,
} from '../residents/schemas/resident.schema';
import { CreateResidentPhotoDto } from './dto/create-resident-photo.dto';
import { UpdateResidentPhotoDto } from './dto/update-resident-photo.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResidentPhotosService {
  constructor(
    @InjectModel(ResidentPhoto.name)
    private photoModel: Model<ResidentPhotoDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
  ) {}

  async uploadPhoto(data: any) {
    try {
      console.log('Upload photo data:', data);

      // Validate resident_id
      if (!data.resident_id) {
        throw new Error('resident_id is required');
      }

      if (!Types.ObjectId.isValid(data.resident_id)) {
        throw new Error('Invalid resident_id format');
      }

      // Check if resident exists
      const resident = await this.residentModel.findById(data.resident_id);
      if (!resident) {
        throw new Error('Resident not found');
      }

      // Validate uploaded_by
      if (!data.uploaded_by) {
        throw new Error('uploaded_by is required');
      }

      if (!Types.ObjectId.isValid(data.uploaded_by)) {
        throw new Error('Invalid uploaded_by format');
      }

      const photo = new this.photoModel({
        family_id: resident.family_member_id, // Đúng là family_member_id của resident
        uploaded_by: new Types.ObjectId(data.uploaded_by),
        file_name: data.file_name,
        file_path: data.file_path, // Store as-is, URL transformation happens in getFileUrl
        file_type: data.file_type,
        file_size: data.file_size,
        caption: data.caption,
        activity_type: data.activity_type,
        tags: data.tags,
        upload_date: new Date(),
        taken_date: data.taken_date ? new Date(data.taken_date) : undefined,
        staff_notes: data.staff_notes,
        related_activity_id: data.related_activity_id
          ? new Types.ObjectId(data.related_activity_id)
          : undefined,
        resident_id: new Types.ObjectId(data.resident_id),
      });

      console.log('Photo object to save:', photo);
      const savedPhoto = await photo.save();
      console.log('Photo saved successfully:', savedPhoto);
      return savedPhoto;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  async getPhotos(family_member_id: string) {
    // Validate family_member_id
    if (!family_member_id) {
      throw new Error('family_member_id is required');
    }

    if (!Types.ObjectId.isValid(family_member_id)) {
      throw new Error('Invalid family_member_id format');
    }

    // Step 1: Find all residents that belong to this family member
    const residents = await this.residentModel
      .find({
        family_member_id: new Types.ObjectId(family_member_id),
      })
      .select('_id');

    // Step 2: Extract resident IDs
    const residentIds = residents.map((resident) => resident._id);

    // Step 3: Find all photos where resident_id is in the list of resident IDs
    const photos = await this.photoModel
      .find({ resident_id: { $in: residentIds } })
      .populate('resident_id', 'full_name date_of_birth gender')
      .populate(
        'related_activity_id',
        'activity_name activity_type description location',
      )
      .populate('uploaded_by', 'full_name username position')
      .sort({ upload_date: -1 })
      .exec();

    // Transform photos with correct URLs
    return this.transformPhotosWithUrls(photos);
  }

  async getAllPhotos() {
    console.log('getAllPhotos called');
    const photos = await this.photoModel
      .find()
      .populate('resident_id', 'full_name date_of_birth gender')
      .populate(
        'related_activity_id',
        'activity_name activity_type description location',
      )
      .populate('uploaded_by', 'full_name username position')
      .sort({ upload_date: -1 })
      .exec();
    
    console.log('Found all photos:', photos.length);
    console.log('All photos data:', photos);
    
    // Transform photos with correct URLs
    return this.transformPhotosWithUrls(photos);
  }

  async findAll(family_member_id?: string) {
    if (family_member_id) {
      return this.getPhotos(family_member_id);
    }
    return this.getAllPhotos();
  }

  async findByResidentId(resident_id: string) {
    try {
      console.log('findByResidentId called with resident_id:', resident_id);
      
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new Error('Invalid resident_id format');
      }

      const photos = await this.photoModel
        .find({ resident_id: new Types.ObjectId(resident_id) })
        .populate('resident_id', 'full_name date_of_birth gender')
        .populate(
          'related_activity_id',
          'activity_name activity_type description location',
        )
        .populate('uploaded_by', 'full_name username position')
        .sort({ upload_date: -1 })
        .exec();

      console.log('Found photos for resident:', photos.length);
      console.log('Photos data:', photos);
      
      // Transform photos with correct URLs
      return this.transformPhotosWithUrls(photos);
    } catch (error) {
      console.error('Error in findByResidentId:', error);
      throw error;
    }
  }

  async getPhotoById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid photo ID format');
    }

    const photo = await this.photoModel
      .findById(id)
      .populate('resident_id')
      .populate('related_activity_id')
      .populate('uploaded_by')
      .exec();

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

  // Helper method to get correct file URL
  getFileUrl(file_path: string): string {
    if (!file_path) return '';
    
    // If it's already a full URL, return as is
    if (file_path.startsWith('http')) {
      return file_path;
    }
    
    // Always return with /uploads/ prefix for serving
    // The actual file location is handled by static file serving in main.ts
    if (file_path.startsWith('uploads/')) {
      return file_path;
    } else {
      return `uploads/${file_path}`;
    }
  }

  // Transform photos to include correct URLs
  transformPhotosWithUrls(photos: any[]): any[] {
    return photos.map(photo => ({
      ...photo.toObject(),
      file_url: this.getFileUrl(photo.file_path),
      is_video: photo.file_type?.startsWith('video/') || false,
    }));
  }

  // Fix file paths in database (remove duplicate /tmp/tmp)
  async fixFilePaths() {
    try {
      console.log('Starting file path fix...');
      
      // Find all photos with incorrect paths
      const photosWithBadPaths = await this.photoModel.find({
        file_path: { $regex: /\/tmp\/tmp/ }
      });
      
      console.log(`Found ${photosWithBadPaths.length} photos with incorrect paths`);
      
      let fixedCount = 0;
      
      for (const photo of photosWithBadPaths) {
        const oldPath = photo.file_path;
        const newPath = oldPath.replace('/tmp/tmp/uploads/', 'uploads/');
        
        console.log(`Fixing: ${oldPath} -> ${newPath}`);
        
        await this.photoModel.findByIdAndUpdate(photo._id, {
          file_path: newPath
        });
        
        fixedCount++;
      }
      
      console.log(`Fixed ${fixedCount} file paths`);
      
      return {
        message: `Fixed ${fixedCount} file paths`,
        totalFound: photosWithBadPaths.length,
        fixedCount: fixedCount
      };
    } catch (error) {
      console.error('Error fixing file paths:', error);
      throw error;
    }
  }
}
