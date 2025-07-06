import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ActivityParticipation,
  ActivityParticipationDocument,
} from './schemas/activity-participation.schema';
import { CreateActivityParticipationDto } from './dto/create-activity-participation.dto';
import { UpdateActivityParticipationDto } from './dto/update-activity-participation.dto';

@Injectable()
export class ActivityParticipationsService {
  constructor(
    @InjectModel(ActivityParticipation.name)
    private participationModel: Model<ActivityParticipationDocument>,
  ) {}

  async create(createDto: CreateActivityParticipationDto): Promise<ActivityParticipation> {
    const createdParticipation = new this.participationModel(createDto);
    return createdParticipation.save();
  }

  async findAll(): Promise<ActivityParticipation[]> {
    return this.participationModel
      .find()
      .populate('staffId', 'fullName')
      .populate('activityId', 'activityName')
      .populate('residentId', 'fullName')
      .exec();
  }

  async findOne(id: string): Promise<ActivityParticipation> {
    const participation = await this.participationModel
      .findById(id)
      .populate('staffId', 'fullName')
      .populate('activityId', 'activityName')
      .populate('residentId', 'fullName')
      .exec();
    if (!participation) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return participation;
  }

  async update(id: string, updateDto: UpdateActivityParticipationDto): Promise<ActivityParticipation> {
    const existingParticipation = await this.participationModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    if (!existingParticipation) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return existingParticipation;
  }

  async remove(id: string): Promise<any> {
    const result = await this.participationModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async approve(id: string): Promise<ActivityParticipation> {
    const participation = await this.participationModel.findByIdAndUpdate(
      id,
      { approvalStatus: 'approved' },
      { new: true }
    ).exec();
    if (!participation) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return participation;
  }

  async reject(id: string): Promise<ActivityParticipation> {
    const participation = await this.participationModel.findByIdAndUpdate(
      id,
      { approvalStatus: 'rejected' },
      { new: true }
    ).exec();
    if (!participation) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return participation;
  }
} 