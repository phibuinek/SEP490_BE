import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  async create(createDto: CreateActivityDto): Promise<Activity> {
    const createdActivity = new this.activityModel(createDto);
    return createdActivity.save();
  }

  async findAll(): Promise<Activity[]> {
    return this.activityModel.find().exec();
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return activity;
  }

  async update(id: string, updateActivityDto: any) {
    return this.activityModel.findByIdAndUpdate(id, updateActivityDto, {
      new: true,
    });
  }

  async remove(id: string): Promise<any> {
    const result = await this.activityModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
    return { deleted: true };
  }
}
