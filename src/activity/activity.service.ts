import { Injectable, NotFoundException } from '@nestjs/common';
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

  async recommendActivityAI(resident_id: string) {
    console.log('resident_id nhận được:', resident_id);
    const resident = await this.residentModel.findById(resident_id);

    if (!resident) throw new NotFoundException('Resident not found');
    const prompt = `
    Tôi cần tạo một hoạt động cho người cao tuổi ${resident.
      full_name} với các thông tin sau:
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
      return { feedback: text };
    } catch (error) {
      return {
        feedback: 'Đã có lỗi xảy ra khi xử lý bản dịch. Vui lòng thử lại.',
      };
    }  
  }
}
