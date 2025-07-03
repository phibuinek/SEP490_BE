import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AddImageDto } from './dto/add-image.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  async create(createDto: CreateActivityDto, userId: string): Promise<Activity> {
    return this.activityModel.create({
      ...createDto,
      createdBy: userId,
    });
  }

  async findAll(): Promise<Activity[]> {
    return this.activityModel.find().populate('residentId', 'name').populate('assignedTo', 'name');
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityModel.findById(id)
      .populate('residentId', 'name')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name');
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async findByResident(residentId: string): Promise<Activity[]> {
    return this.activityModel.find({ residentId })
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort({ date: -1 });
  }

  async update(id: string, updateDto: UpdateActivityDto, userId: string): Promise<Activity> {
    const activity = await this.activityModel.findByIdAndUpdate(
      id, 
      { ...updateDto, updatedBy: userId }, 
      { new: true }
    );
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async remove(id: string): Promise<Activity> {
    const activity = await this.activityModel.findByIdAndDelete(id);
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async addImage(id: string, imageDto: AddImageDto, userId: string): Promise<Activity> {
    const activity = await this.activityModel.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');

    activity.images.push({
      ...imageDto,
      uploadedAt: new Date(),
      uploadedBy: new Types.ObjectId(userId),
    });

    return activity.save();
  }

  async removeImage(id: string, imageIndex: number): Promise<Activity> {
    const activity = await this.activityModel.findById(id);
    if (!activity) throw new NotFoundException('Activity not found');
    if (imageIndex < 0 || imageIndex >= activity.images.length) {
      throw new NotFoundException('Image not found');
    }

    activity.images.splice(imageIndex, 1);
    return activity.save();
  }
} 