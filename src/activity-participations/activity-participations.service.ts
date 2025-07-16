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
    if (!Types.ObjectId.isValid(createDto.staff_id)) {
      throw new BadRequestException('Invalid staff_id format');
    }
    if (!Types.ObjectId.isValid(createDto.activity_id)) {
      throw new BadRequestException('Invalid activity_id format');
    }
    if (!Types.ObjectId.isValid(createDto.resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }

    // Convert string IDs to ObjectIds
    const participationData = {
      ...createDto,
      staff_id: new Types.ObjectId(createDto.staff_id),
      activity_id: new Types.ObjectId(createDto.activity_id),
      resident_id: new Types.ObjectId(createDto.resident_id),
    };

    const createdParticipation = new this.participationModel(participationData);
    return createdParticipation.save();
  }

  async findAll(): Promise<ActivityParticipation[]> {
    try {
      return await this.participationModel
        .find()
        .populate('staff_id', 'full_name')
        .populate('activity_id', 'activity_name')
        .populate('resident_id', 'full_name')
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
        .populate('staff_id', 'full_name')
        .populate('activity_id', 'activity_name')
        .populate('resident_id', 'full_name')
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
    if (updateDto.staff_id && !Types.ObjectId.isValid(updateDto.staff_id)) {
      throw new BadRequestException('Invalid staff_id format');
    }
    if (updateDto.activity_id && !Types.ObjectId.isValid(updateDto.activity_id)) {
      throw new BadRequestException('Invalid activity_id format');
    }
    if (updateDto.resident_id && !Types.ObjectId.isValid(updateDto.resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }

    // Convert string IDs to ObjectIds if they exist
    const updateData: any = { ...updateDto };
    if (updateDto.staff_id) {
      updateData.staff_id = new Types.ObjectId(updateDto.staff_id);
    }
    if (updateDto.activity_id) {
      updateData.activity_id = new Types.ObjectId(updateDto.activity_id);
    }
    if (updateDto.resident_id) {
      updateData.resident_id = new Types.ObjectId(updateDto.resident_id);
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

  async getTodayForFamily(family_id: string, resident_id: string, date?: string) {
    if (!Types.ObjectId.isValid(resident_id)) {
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
        resident_id: new Types.ObjectId(resident_id),
        date: { $gte: start, $lte: end },
      })
      .populate('activity_id')
      .exec();
    // Map kết quả trả về thông tin cần thiết
    return participations.map((p) => {
      let activity: any = undefined;
      if (
        p.activity_id &&
        typeof p.activity_id === 'object' &&
        !('equals' in p.activity_id)
      ) {
        activity = p.activity_id;
      }
      return {
        activity_name: activity?.activity_name,
        schedule_time: activity?.schedule_time,
        location: activity?.location,
        description: activity?.description,
        attendance_status: p.attendance_status,
        performance_notes: p.performance_notes,
      };
    });
  }
}
