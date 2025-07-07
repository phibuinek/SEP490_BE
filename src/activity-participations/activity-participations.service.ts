import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ActivityParticipation,
  ActivityParticipationDocument,
} from './schemas/activity-participation.schema';
import { CreateActivityParticipationDto } from './dto/create-activity-participation.dto';
import { UpdateActivityParticipationDto } from './dto/update-activity-participation.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Activity } from '../activity/schemas/activity.schema';

@Injectable()
export class ActivityParticipationsService {
  constructor(
    @InjectModel(ActivityParticipation.name)
    private participationModel: Model<ActivityParticipationDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Activity.name)
    private activityModel: Model<Activity>,
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

  async getTodayForFamily(familyId: string, residentId: string, date?: string) {
    // TODO: Nếu user không có trường residents, bỏ qua check này hoặc kiểm tra bằng service residents
    // Xác định ngày cần lấy (mặc định là hôm nay)
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0,0,0,0);
    const end = new Date(targetDate);
    end.setHours(23,59,59,999);
    // Lấy các participation của resident trong ngày
    const participations = await this.participationModel.find({
      residentId: residentId,
      date: { $gte: start, $lte: end }
    }).populate('activityId').exec();
    // Map kết quả trả về thông tin cần thiết
    return participations.map(p => {
      let activity: any = undefined;
      if (p.activityId && typeof p.activityId === 'object' && !('equals' in p.activityId)) {
        activity = p.activityId;
      }
      return {
        activityName: activity?.activityName,
        scheduleTime: activity?.scheduleTime,
        location: activity?.location,
        description: activity?.description,
        attendanceStatus: p.attendanceStatus,
        approvalStatus: p.approvalStatus,
        performanceNotes: p.performanceNotes,
      };
    });
  }
} 