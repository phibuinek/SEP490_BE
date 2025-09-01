import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityParticipation, ActivityParticipationDocument } from '../activity-participations/schemas/activity-participation.schema';
import axios from 'axios';

@Injectable()
export class ActivityService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
    @InjectModel(ActivityParticipation.name) private participationModel: Model<ActivityParticipationDocument>,
  ) {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.apiUrl =
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
  }

  async create(createDto: CreateActivityDto): Promise<Activity> {
    console.log('ActivityService.create called with:', createDto);
    
    // Kiểm tra trùng lặp tên hoạt động + ngày + staff_id (bất kể giờ nào)
    const inputDate = new Date(createDto.schedule_time);
    console.log('Parsed inputDate:', inputDate);
    
    const startOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999);
    
    const exists = await this.activityModel.findOne({
      activity_name: createDto.activity_name,
      staff_id: createDto.staff_id,
      schedule_time: { $gte: startOfDay, $lte: endOfDay },
    });
    if (exists) {
      throw new BadRequestException('Bạn đã có hoạt động với tên này trong ngày này!');
    }

    // Kiểm tra trùng lịch với staff (nếu có staff_id)
    if (createDto.staff_id) {
      await this.checkStaffScheduleConflict(createDto.staff_id, new Date(createDto.schedule_time), createDto.duration);
    }
    
    // Tạo activity với schedule_time là Date object từ string
    const activityData = {
      ...createDto,
      schedule_time: new Date(createDto.schedule_time)
    };
    
    console.log('Activity data to save:', activityData);
    
    const createdActivity = new this.activityModel(activityData);
    const savedActivity = await createdActivity.save();
    console.log('Activity saved successfully:', savedActivity);
    return savedActivity;
  }

  /**
   * Kiểm tra trùng lịch với staff khi cập nhật hoạt động
   */
  async checkStaffScheduleConflictForUpdate(activityId: string, staffId: string, scheduleTime: Date, duration: number): Promise<void> {
    try {
      const newActivityStartTime = new Date(scheduleTime);
      const newActivityEndTime = new Date(newActivityStartTime.getTime() + duration * 60 * 1000);

      // Lấy tất cả activities của staff trong cùng ngày (loại trừ activity hiện tại)
      const startOfDay = new Date(newActivityStartTime.getFullYear(), newActivityStartTime.getMonth(), newActivityStartTime.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const existingActivities = await this.activityModel.find({
        _id: { $ne: activityId }, // Loại trừ activity hiện tại
        staff_id: new Types.ObjectId(staffId),
        schedule_time: { $gte: startOfDay, $lte: endOfDay }
      }).exec();

      for (const activity of existingActivities) {
        const existingActivityStartTime = new Date(activity.schedule_time);
        const existingActivityEndTime = new Date(existingActivityStartTime.getTime() + (activity.duration || 60) * 60 * 1000);

        // Kiểm tra overlap thời gian
        if (newActivityStartTime < existingActivityEndTime && newActivityEndTime > existingActivityStartTime) {
          const activityStartTime = existingActivityStartTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const activityEndTime = existingActivityEndTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          throw new BadRequestException(
            `Nhân viên đã có hoạt động "${activity.activity_name}" từ ${activityStartTime} đến ${activityEndTime} trong cùng ngày. Vui lòng chọn thời gian khác.`
          );
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error checking staff schedule conflict for update:', error);
      // Nếu có lỗi khi kiểm tra, cho phép cập nhật hoạt động
    }
  }

  /**
   * Kiểm tra trùng lịch với staff khi tạo hoạt động mới
   */
  async checkStaffScheduleConflict(staffId: string, scheduleTime: Date, duration: number): Promise<void> {
    try {
      const newActivityStartTime = new Date(scheduleTime);
      const newActivityEndTime = new Date(newActivityStartTime.getTime() + duration * 60 * 1000);

      // Lấy tất cả activities của staff trong cùng ngày
      const startOfDay = new Date(newActivityStartTime.getFullYear(), newActivityStartTime.getMonth(), newActivityStartTime.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

      const existingActivities = await this.activityModel.find({
        staff_id: new Types.ObjectId(staffId),
        schedule_time: { $gte: startOfDay, $lte: endOfDay }
      }).exec();

      for (const activity of existingActivities) {
        const existingActivityStartTime = new Date(activity.schedule_time);
        const existingActivityEndTime = new Date(existingActivityStartTime.getTime() + (activity.duration || 60) * 60 * 1000);

        // Kiểm tra overlap thời gian
        if (newActivityStartTime < existingActivityEndTime && newActivityEndTime > existingActivityStartTime) {
          const activityStartTime = existingActivityStartTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const activityEndTime = existingActivityEndTime.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          throw new BadRequestException(
            `Nhân viên đã có hoạt động "${activity.activity_name}" từ ${activityStartTime} đến ${activityEndTime} trong cùng ngày. Vui lòng chọn thời gian khác.`
          );
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error checking staff schedule conflict:', error);
      // Nếu có lỗi khi kiểm tra, cho phép tạo hoạt động
    }
  }

  /**
   * Kiểm tra trùng lịch với cư dân khi cập nhật hoạt động
   */
  async checkScheduleConflictWithResidentForUpdate(activityId: string, residentId: string, scheduleTime: Date, duration: number): Promise<void> {
    try {
      // Lấy tất cả participations của cư dân (loại trừ activity hiện tại)
      const residentParticipations = await this.participationModel
        .find({ 
          resident_id: new Types.ObjectId(residentId),
          activity_id: { $ne: new Types.ObjectId(activityId) } // Loại trừ activity hiện tại
        })
        .populate('activity_id')
        .exec();

      const newActivityStartTime = new Date(scheduleTime);
      const newActivityEndTime = new Date(newActivityStartTime.getTime() + duration * 60 * 1000);

      // Kiểm tra trùng lịch trong cùng ngày
      for (const participation of residentParticipations) {
        if (!participation.activity_id || typeof participation.activity_id === 'string') {
          continue;
        }

        const existingActivity = participation.activity_id as any;
        if (!existingActivity.schedule_time) {
          continue;
        }

        const existingActivityStartTime = new Date(existingActivity.schedule_time);
        const existingActivityEndTime = new Date(existingActivityStartTime.getTime() + (existingActivity.duration || 60) * 60 * 1000);

        // Kiểm tra cùng ngày
        const newDateStr = newActivityStartTime.toISOString().split('T')[0];
        const existingDateStr = existingActivityStartTime.toISOString().split('T')[0];

        if (newDateStr === existingDateStr) {
          // Kiểm tra overlap thời gian
          if (newActivityStartTime < existingActivityEndTime && newActivityEndTime > existingActivityStartTime) {
            const activityTime = existingActivityStartTime.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            throw new BadRequestException(
              `Cư dân đã có hoạt động "${existingActivity.activity_name}" vào lúc ${activityTime} trong cùng ngày. Vui lòng chọn thời gian khác.`
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error checking schedule conflict for update:', error);
      // Nếu có lỗi khi kiểm tra, cho phép cập nhật hoạt động
    }
  }

  /**
   * Kiểm tra trùng lịch với cư dân khi tạo hoạt động mới
   */
  async checkScheduleConflictWithResident(residentId: string, scheduleTime: Date, duration: number): Promise<void> {
    try {
      // Lấy tất cả participations của cư dân
      const residentParticipations = await this.participationModel
        .find({ resident_id: new Types.ObjectId(residentId) })
        .populate('activity_id')
        .exec();

      const newActivityStartTime = new Date(scheduleTime);
      const newActivityEndTime = new Date(newActivityStartTime.getTime() + duration * 60 * 1000);

      // Kiểm tra trùng lịch trong cùng ngày
      for (const participation of residentParticipations) {
        if (!participation.activity_id || typeof participation.activity_id === 'string') {
          continue;
        }

        const existingActivity = participation.activity_id as any;
        if (!existingActivity.schedule_time) {
          continue;
        }

        const existingActivityStartTime = new Date(existingActivity.schedule_time);
        const existingActivityEndTime = new Date(existingActivityStartTime.getTime() + (existingActivity.duration || 60) * 60 * 1000);

        // Kiểm tra cùng ngày
        const newDateStr = newActivityStartTime.toISOString().split('T')[0];
        const existingDateStr = existingActivityStartTime.toISOString().split('T')[0];

        if (newDateStr === existingDateStr) {
          // Kiểm tra overlap thời gian
          if (newActivityStartTime < existingActivityEndTime && newActivityEndTime > existingActivityStartTime) {
            const activityTime = existingActivityStartTime.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            throw new BadRequestException(
              `Cư dân đã có hoạt động "${existingActivity.activity_name}" vào lúc ${activityTime} trong cùng ngày. Vui lòng chọn thời gian khác.`
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error checking schedule conflict:', error);
      // Nếu có lỗi khi kiểm tra, cho phép tạo hoạt động
    }
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
    // Tìm activity hiện tại để so sánh
    const existingActivity = await this.activityModel.findById(id);
    if (!existingActivity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    // Nếu có schedule_time, chuyển đổi từ string sang Date
    if (updateActivityDto.schedule_time) {
      updateActivityDto.schedule_time = new Date(updateActivityDto.schedule_time);
    }

    // Kiểm tra xem có thay đổi thời gian, duration hoặc staff_id không
    const scheduleTimeChanged = updateActivityDto.schedule_time && 
      updateActivityDto.schedule_time.getTime() !== existingActivity.schedule_time.getTime();
    const durationChanged = updateActivityDto.duration && 
      updateActivityDto.duration !== existingActivity.duration;
    const staffChanged = updateActivityDto.staff_id && 
      updateActivityDto.staff_id !== existingActivity.staff_id.toString();

    // Nếu có thay đổi về thời gian, cần kiểm tra conflicts
    if (scheduleTimeChanged || durationChanged || staffChanged) {
      const newScheduleTime = updateActivityDto.schedule_time || existingActivity.schedule_time;
      const newDuration = updateActivityDto.duration || existingActivity.duration;
      const newStaffId = updateActivityDto.staff_id || existingActivity.staff_id.toString();

      // Kiểm tra trùng lặp tên hoạt động + ngày + staff_id (nếu thay đổi)
      if (updateActivityDto.activity_name || scheduleTimeChanged || staffChanged) {
        const activityName = updateActivityDto.activity_name || existingActivity.activity_name;
        const inputDate = new Date(newScheduleTime);
        
        const startOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999);
        
        const duplicateActivity = await this.activityModel.findOne({
          _id: { $ne: id }, // Loại trừ activity hiện tại
          activity_name: activityName,
          staff_id: newStaffId,
          schedule_time: { $gte: startOfDay, $lte: endOfDay },
        });

        if (duplicateActivity) {
          throw new BadRequestException('Bạn đã có hoạt động với tên này trong ngày này!');
        }
      }

      // Kiểm tra trùng lịch với staff
      await this.checkStaffScheduleConflictForUpdate(id, newStaffId, newScheduleTime, newDuration);
    }
    
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

  async recommendActivityAI(resident_ids: string[], schedule_time?: string) {
    // Thêm logging để debug
    console.log('Received resident_ids:', resident_ids);
    console.log('Type of resident_ids:', typeof resident_ids);
    console.log('Is Array?', Array.isArray(resident_ids));
    console.log('Received schedule_time:', schedule_time);
    
    // Validation để đảm bảo resident_ids là array
    if (!Array.isArray(resident_ids)) {
      throw new Error(`resident_ids must be an array, received: ${typeof resident_ids}`);
    }
    
    const results: any[] = [];
    for (const resident_id of resident_ids) {
      const resident = await this.residentModel.findById(resident_id);
      if (!resident) {
        results.push({ resident_id, feedback: 'Resident not found' });
        continue;
      }
      
      // Tạo prompt với thông tin thời gian cụ thể nếu có
      let timeInfo = 'vào thời gian phù hợp';
      if (schedule_time) {
        const scheduleDate = new Date(schedule_time);
        const formattedDate = scheduleDate.toLocaleDateString('vi-VN');
        const formattedTime = scheduleDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        timeInfo = `vào thời gian cụ thể: ${formattedTime} ngày ${formattedDate}`;
      }
      
      const prompt = `
        Tôi cần tạo 3-5 hoạt động đa dạng cho người cao tuổi ${resident.full_name} ${timeInfo}. 
        
        Mỗi hoạt động cần có format như sau:
        
        **HOẠT ĐỘNG 1:**
        **Tên hoạt động:** [Tên hoạt động]
        **Thời lượng:** [Thời gian]
        **Độ khó:** [Dễ/Trung bình/Khó]
        **Thời điểm:** [Buổi sáng/chiều/tối]
        **Địa điểm:** [Chỉ chọn 1 trong các địa điểm sau: Phòng hoạt động, Khu vực chung, Phòng ăn, Vườn, Phòng trị liệu, Thư viện, Sân hiên ngoài trời, Phòng riêng]
        **Mục tiêu:**
        • [Mục tiêu 1]
        • [Mục tiêu 2]
        • [Mục tiêu 3]
        **Mô tả:** [Mô tả chi tiết hoạt động]
        **Lợi ích:** [Lợi ích 1, lợi ích 2, lợi ích 3]
        **Lưu ý quan trọng:** [Lưu ý về sức khỏe]
        
        **HOẠT ĐỘNG 2:**
        [Format tương tự...]
        
        **HOẠT ĐỘNG 3:**
        [Format tương tự...]
        
        Và cứ tiếp tục cho 3-5 hoạt động khác nhau, đa dạng về loại hình (vận động, tinh thần, xã hội, sáng tạo).
        
        **LƯU Ý QUAN TRỌNG:** Địa điểm phải là 1 trong các địa điểm sau và không được thay đổi:
        - Phòng hoạt động
        - Khu vực chung  
        - Phòng ăn
        - Vườn
        - Phòng trị liệu
        - Thư viện
        - Sân hiên ngoài trời
        - Phòng riêng
        
        Thông tin bệnh lý của người này: ${resident.medical_history}
        
        Hãy tạo các hoạt động phù hợp với tình trạng sức khỏe và sở thích của người cao tuổi.
      `;
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': this.apiKey,
            },
            timeout: 10000,
          },
        );
        const text =
          response.data.candidates?.[0]?.content?.parts?.[0]?.text ??
          'Không có phản hồi từ AI.';
        results.push({ resident_id, feedback: text });
      } catch (error) {
        results.push({
          resident_id,
          feedback: 'Đã có lỗi xảy ra khi xử lý bản dịch. Vui lòng thử lại.',
        });
      }
    }
    return results;
  }
}
