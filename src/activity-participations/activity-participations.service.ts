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
import {
  Resident,
  ResidentDocument,
} from '../residents/schemas/resident.schema';
import { AttendanceStatus } from './schemas/activity-participation.schema';

@Injectable()
export class ActivityParticipationsService {
  constructor(
    @InjectModel(ActivityParticipation.name)
    private participationModel: Model<ActivityParticipationDocument>,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Activity.name)
    private activityModel: Model<Activity>,
    @InjectModel(Resident.name)
    private residentModel: Model<Resident>,
  ) {}

  async create(
    createActivityParticipationDto: CreateActivityParticipationDto,
    req: any,
  ): Promise<ActivityParticipation> {
    try {
      const {
        staff_id,
        activity_id,
        resident_id,
        date,
        attendance_status,
        performance_notes,
      } = createActivityParticipationDto;
      const admin_id = req.user.user_id;

      console.log('Creating activity participation with data:', {
        staff_id,
        activity_id,
        resident_id,
        date,
        attendance_status,
        performance_notes,
      });

      // Validate staff_id format
      if (!Types.ObjectId.isValid(staff_id)) {
        throw new BadRequestException('Định dạng ID nhân viên không hợp lệ');
      }

      // Validate activity_id format
      if (!Types.ObjectId.isValid(activity_id)) {
        throw new BadRequestException('Định dạng ID hoạt động không hợp lệ');
      }

      // Validate resident_id format
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException(
          'Định dạng ID người cao tuổi không hợp lệ',
        );
      }

      // Validate date format
      let participationDate: Date;
      try {
        participationDate = date ? new Date(date) : new Date();
        if (isNaN(participationDate.getTime())) {
          throw new BadRequestException('Định dạng ngày không hợp lệ');
        }
      } catch (error) {
        throw new BadRequestException('Định dạng ngày không hợp lệ');
      }

      // Check if staff exists and is actually a staff
      const staff = await this.userModel.findById(staff_id);
      if (!staff) {
        throw new NotFoundException('Không tìm thấy thông tin nhân viên');
      }
      if (staff.role !== 'staff') {
        throw new BadRequestException('Người dùng này không phải là nhân viên');
      }

      // Check if activity exists
      const activity = await this.activityModel.findById(activity_id);
      if (!activity) {
        throw new NotFoundException('Không tìm thấy hoạt động');
      }

      // Check if resident exists
      const resident = await this.residentModel.findById(resident_id);
      if (!resident) {
        throw new NotFoundException('Không tìm thấy thông tin người cao tuổi');
      }

      // Check if participation already exists for the same date
      const existingParticipation = await this.participationModel.findOne({
        staff_id: new Types.ObjectId(staff_id),
        activity_id: new Types.ObjectId(activity_id),
        resident_id: new Types.ObjectId(resident_id),
        date: {
          $gte: new Date(
            participationDate.getFullYear(),
            participationDate.getMonth(),
            participationDate.getDate(),
          ),
          $lt: new Date(
            participationDate.getFullYear(),
            participationDate.getMonth(),
            participationDate.getDate() + 1,
          ),
        },
      });

      if (existingParticipation) {
        throw new BadRequestException(
          'Đã có bản ghi tham gia hoạt động này cho ngày đã chọn',
        );
      }

      // Create new participation
      const participation = new this.participationModel({
        staff_id: new Types.ObjectId(staff_id),
        activity_id: new Types.ObjectId(activity_id),
        resident_id: new Types.ObjectId(resident_id),
        date: participationDate,
        attendance_status: attendance_status || AttendanceStatus.PENDING,
        performance_notes: performance_notes || '',
      });

      const savedParticipation = await participation.save();
      return savedParticipation;
    } catch (error) {
      console.error('Error creating activity participation:', error);
      throw error;
    }
  }

  /**
   * Check for schedule conflicts when adding a resident to an activity
   */
  private async checkScheduleConflict(
    residentId: string,
    activityId: string,
  ): Promise<void> {
    try {
      // Get the activity details
      const activity = await this.activityModel.findById(activityId).exec();
      if (!activity) {
        throw new BadRequestException('Activity not found');
      }

      // Get all participations for this resident
      const residentParticipations = await this.participationModel
        .find({ resident_id: new Types.ObjectId(residentId) })
        .populate('activity_id')
        .exec();

      // Get the activity date and time
      const newActivityDate = new Date(activity.schedule_time);
      const newActivityEndTime = new Date(
        newActivityDate.getTime() + (activity.duration || 60) * 60 * 1000,
      );

      // Check for conflicts on the same day
      for (const participation of residentParticipations) {
        if (
          !participation.activity_id ||
          typeof participation.activity_id === 'string'
        ) {
          continue;
        }

        const existingActivity = participation.activity_id as any;
        if (!existingActivity.schedule_time) {
          continue;
        }

        const existingActivityDate = new Date(existingActivity.schedule_time);
        const existingActivityEndTime = new Date(
          existingActivityDate.getTime() +
            (existingActivity.duration || 60) * 60 * 1000,
        );

        // Check if activities are on the same day
        const newDateStr = newActivityDate.toISOString().split('T')[0];
        const existingDateStr = existingActivityDate
          .toISOString()
          .split('T')[0];

        if (newDateStr === existingDateStr) {
          // Check for time overlap
          if (
            newActivityDate < existingActivityEndTime &&
            newActivityEndTime > existingActivityDate
          ) {
            const activityTime = existingActivityDate.toLocaleTimeString(
              'vi-VN',
              {
                hour: '2-digit',
                minute: '2-digit',
              },
            );

            throw new BadRequestException(
              `Cư dân đã có hoạt động "${existingActivity.activity_name}" vào lúc ${activityTime} trong cùng ngày. Vui lòng chọn thời gian khác.`,
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error checking schedule conflict:', error);
      // If there's an error checking conflicts, we'll allow the creation to proceed
      // but log the error for debugging
    }
  }

  async findAll(): Promise<ActivityParticipation[]> {
    try {
      return await this.participationModel
        .find()
        .populate('staff_id', 'full_name position email phone role')
        .populate(
          'activity_id',
          'activity_name description activity_type duration schedule_time location capacity',
        )
        .populate('resident_id', 'full_name date_of_birth gender')
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
      throw new BadRequestException('Định dạng ID tham gia không hợp lệ');
    }

    const participation = await this.participationModel
      .findById(id)
      .populate('staff_id', 'full_name email position role')
      .populate('activity_id', 'name description')
      .populate('resident_id', 'full_name room_number')
      .exec();

    if (!participation) {
      throw new NotFoundException(
        `Không tìm thấy thông tin tham gia với ID "${id}"`,
      );
    }

    return participation;
  }

  async update(
    id: string,
    updateActivityParticipationDto: UpdateActivityParticipationDto,
  ): Promise<ActivityParticipation> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID tham gia không hợp lệ');
    }

    const participation = await this.participationModel.findById(id);
    if (!participation) {
      throw new NotFoundException(
        `Không tìm thấy thông tin tham gia với ID "${id}"`,
      );
    }

    // Validate staff_id format if provided
    if (
      updateActivityParticipationDto.staff_id &&
      !Types.ObjectId.isValid(updateActivityParticipationDto.staff_id)
    ) {
      throw new BadRequestException('Định dạng ID nhân viên không hợp lệ');
    }

    // Validate activity_id format if provided
    if (
      updateActivityParticipationDto.activity_id &&
      !Types.ObjectId.isValid(updateActivityParticipationDto.activity_id)
    ) {
      throw new BadRequestException('Định dạng ID hoạt động không hợp lệ');
    }

    // Validate resident_id format if provided
    if (
      updateActivityParticipationDto.resident_id &&
      !Types.ObjectId.isValid(updateActivityParticipationDto.resident_id)
    ) {
      throw new BadRequestException('Định dạng ID người cao tuổi không hợp lệ');
    }

    const updatedParticipation = await this.participationModel
      .findByIdAndUpdate(id, updateActivityParticipationDto, { new: true })
      .populate('staff_id', 'full_name email position role')
      .populate('activity_id', 'name description')
      .populate('resident_id', 'full_name room_number')
      .exec();

    if (!updatedParticipation) {
      throw new NotFoundException(
        `Không tìm thấy thông tin tham gia với ID "${id}"`,
      );
    }

    return updatedParticipation;
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

  async getTodayForFamily(
    family_id: string,
    resident_id: string,
    date?: string,
  ) {
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

  async findByResidentId(
    resident_id: string,
  ): Promise<ActivityParticipation[]> {
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }
    return this.participationModel
      .find({ resident_id: new Types.ObjectId(resident_id) })
      .populate('staff_id', 'full_name position')
      .populate(
        'activity_id',
        'activity_name description activity_type duration schedule_time location capacity',
      )
      .populate('resident_id', 'full_name')
      .exec();
  }

  async findByStaffId(staff_id: string): Promise<ActivityParticipation[]> {
    if (!Types.ObjectId.isValid(staff_id)) {
      throw new BadRequestException('Invalid staff_id format');
    }
    return this.participationModel
      .find({ staff_id: new Types.ObjectId(staff_id) })
      .populate('staff_id', 'full_name role position')
      .populate(
        'activity_id',
        'activity_name description activity_type duration schedule_time location capacity',
      )
      .populate('resident_id', 'full_name')
      .exec();
  }

  // API đơn giản: trả về document gốc không populate
  async findByResidentIdRaw(
    resident_id: string,
  ): Promise<ActivityParticipation[]> {
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }
    return this.participationModel
      .find({ resident_id: new Types.ObjectId(resident_id) })
      .exec();
  }

  async findByActivityId(
    activity_id: string,
    date?: string,
  ): Promise<ActivityParticipation[]> {
    if (!Types.ObjectId.isValid(activity_id)) {
      throw new BadRequestException('Invalid activity_id format');
    }

    try {
      const query: any = { activity_id: new Types.ObjectId(activity_id) };

      // Nếu có date, thêm filter theo ngày
      if (date) {
        const targetDate = new Date(date);
        const start = new Date(targetDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      }

      return await this.participationModel
        .find(query)
        .populate('staff_id', 'full_name role position')
        .populate(
          'activity_id',
          'activity_name description activity_type duration schedule_time location capacity',
        )
        .populate('resident_id', 'full_name room age')
        .exec();
    } catch (error) {
      console.error('Error in findByActivityId:', error);
      throw error;
    }
  }

  async findByResidentAndActivity(
    resident_id: string,
    activity_id: string,
  ): Promise<ActivityParticipation> {
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }
    if (!Types.ObjectId.isValid(activity_id)) {
      throw new BadRequestException('Invalid activity_id format');
    }

    try {
      const participation = await this.participationModel
        .findOne({
          resident_id: new Types.ObjectId(resident_id),
          activity_id: new Types.ObjectId(activity_id),
        })
        .populate('staff_id', 'full_name role position')
        .populate(
          'activity_id',
          'activity_name description activity_type duration schedule_time location capacity',
        )
        .populate('resident_id', 'full_name room age')
        .exec();

      if (!participation) {
        throw new NotFoundException(
          `Participation not found for resident ${resident_id} and activity ${activity_id}`,
        );
      }

      return participation;
    } catch (error) {
      console.error('Error in findByResidentAndActivity:', error);
      throw error;
    }
  }

  async countDistinctActivitiesByStaff(staff_id: string): Promise<{ staff_id: string; distinct_activity_count: number }> {
    if (!Types.ObjectId.isValid(staff_id)) {
      throw new BadRequestException('Invalid staff_id format');
    }

    try {
      const distinctActivities = await this.participationModel.distinct('activity_id', {
        staff_id: new Types.ObjectId(staff_id),
      });
      return {
        staff_id,
        distinct_activity_count: Array.isArray(distinctActivities) ? distinctActivities.length : 0,
      };
    } catch (error) {
      console.error('Error counting distinct activities by staff:', error);
      throw new BadRequestException('Failed to count distinct activities by staff');
    }
  }

  async countDistinctActivitiesForAllStaff(): Promise<
    Array<{ staff_id: string; full_name?: string; email?: string; position?: string; distinct_activity_count: number }>
  > {
    try {
      // Get all staff users
      const staffUsers = await this.userModel
        .find({ role: 'staff' }, 'full_name email position')
        .exec();

      // Aggregate participations to count distinct activity_id per staff
      const agg = await this.participationModel.aggregate([
        {
          $group: {
            _id: '$staff_id',
            activities: { $addToSet: '$activity_id' },
          },
        },
        {
          $project: {
            _id: 1,
            distinct_activity_count: { $size: '$activities' },
          },
        },
      ]);

      // Build a quick lookup for counts
      const countByStaffId = new Map<string, number>();
      for (const row of agg) {
        if (row && row._id) {
          countByStaffId.set(String(row._id), row.distinct_activity_count || 0);
        }
      }

      // Prepare results for all staff (including zero counts)
      const results = staffUsers.map((u: any) => {
        const idStr = String(u._id);
        return {
          staff_id: idStr,
          full_name: u.full_name,
          email: u.email,
          position: u.position,
          distinct_activity_count: countByStaffId.get(idStr) || 0,
        };
      });

      // Sort ascending by count
      results.sort(
        (a, b) => a.distinct_activity_count - b.distinct_activity_count,
      );

      return results;
    } catch (error) {
      console.error('Error counting distinct activities for all staff:', error);
      throw new BadRequestException(
        'Failed to count distinct activities for all staff',
      );
    }
  }
}
