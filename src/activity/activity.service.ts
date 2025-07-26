import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import axios from 'axios';

@Injectable()
export class ActivityService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
  ) {
    this.apiKey = process.env.GEMINI_API_KEY ?? '';
    this.apiUrl =
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
  }

  async create(createDto: CreateActivityDto): Promise<Activity> {
    // Kiểm tra trùng lặp tên hoạt động + ngày (bất kể giờ nào)
    const inputDate = new Date(createDto.schedule_time);
    const startOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 23, 59, 59, 999);
    const exists = await this.activityModel.findOne({
      activity_name: createDto.activity_name,
      schedule_time: { $gte: startOfDay, $lte: endOfDay },
    });
    if (exists) {
      throw new BadRequestException('Đã có hoạt động này trong ngày này!');
    }
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
        Tôi cần tạo một hoạt động cho người cao tuổi ${resident.full_name} ${timeInfo} với các thông tin sau:
        - Tên hoạt động:
        - Thời gian:
        - Độ khó:
        - Mô tả:
        và người này mắc bệnh lý như sau: ${resident.medical_history}
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
