import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async create(
    createDto: CreateActivityParticipationDto,
  ): Promise<ActivityParticipation> {
    // Validate ObjectId format for all referenced IDs
    if (!Types.ObjectId.isValid(createDto.staffId)) {
      throw new BadRequestException('Invalid staffId format');
    }
    if (!Types.ObjectId.isValid(createDto.activityId)) {
      throw new BadRequestException('Invalid activityId format');
    }
    if (!Types.ObjectId.isValid(createDto.residentId)) {
      throw new BadRequestException('Invalid residentId format');
    }

    // Convert string IDs to ObjectIds
    const participationData = {
      ...createDto,
      staffId: new Types.ObjectId(createDto.staffId),
      activityId: new Types.ObjectId(createDto.activityId),
      residentId: new Types.ObjectId(createDto.residentId),
    };

    const createdParticipation = new this.participationModel(participationData);
    return createdParticipation.save();
  }

  async findAll(): Promise<ActivityParticipation[]> {
    try {
      return await this.participationModel
        .find()
        .populate('staffId', 'fullName')
        .populate('activityId', 'activityName')
        .populate('residentId', 'fullName')
        .exec();
    } catch (error) {
      // If there are invalid ObjectIds in the database, try without populate first
      console.warn(
        'Error during populate, trying without populate:',
        error.message,
      );
      try {
        const participations = await this.participationModel.find().exec();
        return participations;
      } catch (secondError) {
        console.error(
          'Error fetching activity participations:',
          secondError.message,
        );
        throw new BadRequestException(
          'Error fetching activity participations. Please check database data integrity.',
        );
      }
    }
  }

  async findOne(id: string): Promise<ActivityParticipation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participation ID format');
    }
    try {
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
    } catch (error) {
      // Nếu populate lỗi, trả về document gốc không populate
      console.warn(
        'Error during populate in findOne, returning raw document:',
        error.message,
      );
      const raw = await this.participationModel.findById(id).exec();
      if (!raw) {
        throw new NotFoundException(`Participation with ID "${id}" not found`);
      }
      return raw;
    }
  }

  async update(
    id: string,
    updateDto: UpdateActivityParticipationDto,
  ): Promise<ActivityParticipation> {
    // Validate ObjectId format for the participation ID
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participation ID format');
    }

    // Validate ObjectId format for any referenced IDs in the update
    if (updateDto.staffId && !Types.ObjectId.isValid(updateDto.staffId)) {
      throw new BadRequestException('Invalid staffId format');
    }
    if (updateDto.activityId && !Types.ObjectId.isValid(updateDto.activityId)) {
      throw new BadRequestException('Invalid activityId format');
    }
    if (updateDto.residentId && !Types.ObjectId.isValid(updateDto.residentId)) {
      throw new BadRequestException('Invalid residentId format');
    }

    // Convert string IDs to ObjectIds if they exist
    const updateData: any = { ...updateDto };
    if (updateDto.staffId) {
      updateData.staffId = new Types.ObjectId(updateDto.staffId);
    }
    if (updateDto.activityId) {
      updateData.activityId = new Types.ObjectId(updateDto.activityId);
    }
    if (updateDto.residentId) {
      updateData.residentId = new Types.ObjectId(updateDto.residentId);
    }

    const existingParticipation = await this.participationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!existingParticipation) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return existingParticipation;
  }

  async remove(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participation ID format');
    }

    const result = await this.participationModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async approve(id: string): Promise<ActivityParticipation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participation ID format');
    }

    const participation = await this.participationModel
      .findByIdAndUpdate(id, { approvalStatus: 'approved' }, { new: true })
      .exec();
    if (!participation) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return participation;
  }

  async reject(id: string): Promise<ActivityParticipation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid participation ID format');
    }

    const participation = await this.participationModel
      .findByIdAndUpdate(id, { approvalStatus: 'rejected' }, { new: true })
      .exec();
    if (!participation) {
      throw new NotFoundException(`Participation with ID "${id}" not found`);
    }
    return participation;
  }

  async getTodayForFamily(familyId: string, residentId: string, date?: string) {
    if (!Types.ObjectId.isValid(residentId)) {
      throw new BadRequestException('Invalid resident ID format');
    }

    // TODO: Nếu user không có trường residents, bỏ qua check này hoặc kiểm tra bằng service residents
    // Xác định ngày cần lấy (mặc định là hôm nay)
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);
    // Lấy các participation của resident trong ngày
    const participations = await this.participationModel
      .find({
        residentId: new Types.ObjectId(residentId),
        date: { $gte: start, $lte: end },
      })
      .populate('activityId')
      .exec();
    // Map kết quả trả về thông tin cần thiết
    return participations.map((p) => {
      let activity: any = undefined;
      if (
        p.activityId &&
        typeof p.activityId === 'object' &&
        !('equals' in p.activityId)
      ) {
        activity = p.activityId;
      }
      return {
        activityName: activity?.activityName,
        scheduleTime: activity?.scheduleTime,
        location: activity?.location,
        description: activity?.description,
        attendanceStatus: p.attendanceStatus,
        performanceNotes: p.performanceNotes,
      };
    });
  }
}
