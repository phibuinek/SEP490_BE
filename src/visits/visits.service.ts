import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Visit } from './visit.schema';

@Injectable()
export class VisitsService {
  constructor(@InjectModel(Visit.name) private visitModel: Model<Visit>) {}

  async create(data: any) {
    if (data.family_member_id && typeof data.family_member_id === 'string') {
      if (!Types.ObjectId.isValid(data.family_member_id)) {
        throw new Error('Invalid family_member_id format');
      }
      data.family_member_id = new Types.ObjectId(data.family_member_id);
    }
    if (data.resident_id && typeof data.resident_id === 'string') {
      if (!Types.ObjectId.isValid(data.resident_id)) {
        throw new Error('Invalid resident_id format');
      }
      data.resident_id = new Types.ObjectId(data.resident_id);
    }
    if (!data.status) {
      data.status = 'completed';
    }

    // Kiểm tra trùng lịch - chỉ báo trùng khi cùng family member đặt lịch cho cùng resident và cùng thời gian
    const targetDate = new Date(data.visit_date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const existingVisit = await this.visitModel.findOne({
      family_member_id: data.family_member_id,
      resident_id: data.resident_id,
      visit_date: { $gte: startOfDay, $lte: endOfDay },
      visit_time: data.visit_time,
      status: { $ne: 'cancelled' } // Không tính các lịch đã hủy
    }).select('_id').lean(); // Chỉ lấy _id và dùng lean() để tăng tốc

    if (existingVisit) {
      return {
        success: false,
        message: 'Bạn đã có lịch thăm cho người thân này vào khung giờ này. Vui lòng chọn thời gian khác.',
        isDuplicate: true
      };
    }

    const result = await this.visitModel.create(data);
    return {
      success: true,
      data: result,
      message: 'Đặt lịch thăm thành công'
    };
  }

  // Tạo 1 lịch cho nhiều residents cùng lúc
  async createMultiple(data: any) {
    if (data.family_member_id && typeof data.family_member_id === 'string') {
      if (!Types.ObjectId.isValid(data.family_member_id)) {
        throw new Error('Invalid family_member_id format');
      }
      data.family_member_id = new Types.ObjectId(data.family_member_id);
    }
    if (!data.status) {
      data.status = 'completed';
    }

    // Kiểm tra trùng lịch cho tất cả residents
    const targetDate = new Date(data.visit_date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const existingVisits = await this.visitModel.find({
      family_member_id: data.family_member_id,
      resident_id: { $in: data.resident_ids.map((id: string) => new Types.ObjectId(id)) },
      visit_date: { $gte: startOfDay, $lte: endOfDay },
      visit_time: data.visit_time,
      status: { $ne: 'cancelled' } // Không tính các lịch đã hủy
    }).populate('resident_id', 'full_name').lean();

    if (existingVisits.length > 0) {
      const residentNames = existingVisits.map(visit => {
        if (visit.resident_id && typeof visit.resident_id === 'object' && 'full_name' in visit.resident_id) {
          return (visit.resident_id as { full_name: string }).full_name;
        }
        return 'Người thân';
      }).join(', ');
      
      return {
        success: false,
        message: `Bạn đã có lịch thăm cho ${residentNames} vào khung giờ này. Vui lòng chọn thời gian khác.`,
        isDuplicate: true
      };
    }

    // Tạo lịch cho tất cả residents
    const visitsToCreate = data.resident_ids.map((resident_id: string) => ({
      family_member_id: data.family_member_id,
      resident_id: new Types.ObjectId(resident_id),
      visit_date: data.visit_date,
      visit_time: data.visit_time,
      duration: data.duration,
      status: data.status,
      purpose: data.purpose,
      numberOfVisitors: data.numberOfVisitors,
      notes: data.notes
    }));

    const results = await this.visitModel.insertMany(visitsToCreate);
    
    return {
      success: true,
      data: results,
      message: `Đặt lịch thăm thành công cho ${results.length} người thân`
    };
  }

  async getByResident(family_member_id: string, resident_id: string) {
    if (!Types.ObjectId.isValid(family_member_id)) {
      throw new Error('Invalid family_member_id format');
    }
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new Error('Invalid resident_id format');
    }
    
    return this.visitModel.find({ 
      family_member_id: new Types.ObjectId(family_member_id),
      resident_id: new Types.ObjectId(resident_id)
    }).exec();
  }

  async getByFamily(family_member_id: string) {
    if (!Types.ObjectId.isValid(family_member_id)) {
      throw new Error('Invalid family_member_id format');
    }
    
    const visits = await this.visitModel.find({ 
      family_member_id: new Types.ObjectId(family_member_id)
    })
    .populate('resident_id', 'full_name')
    .exec();

    // Nhóm các visits có cùng thời gian
    const groupedVisits = new Map();
    
    visits.forEach(visit => {
      const visitObj = visit.toObject();
      const key = `${visitObj.visit_date}_${visitObj.visit_time}`;
      
      if (!groupedVisits.has(key)) {
        groupedVisits.set(key, {
          _id: visitObj._id,
          family_member_id: visitObj.family_member_id,
          visit_date: visitObj.visit_date,
          visit_time: visitObj.visit_time,
          duration: visitObj.duration,
          status: visitObj.status,
          purpose: visitObj.purpose,
          numberOfVisitors: visitObj.numberOfVisitors,
          notes: visitObj.notes,
          residents_name: []
        });
      }
      
      // Thêm tên resident vào danh sách
      if (visitObj.resident_id && typeof visitObj.resident_id === 'object' && 'full_name' in visitObj.resident_id) {
        const residentName = (visitObj.resident_id as { full_name: string }).full_name;
        if (!groupedVisits.get(key).residents_name.includes(residentName)) {
          groupedVisits.get(key).residents_name.push(residentName);
        }
      }
    });

    return Array.from(groupedVisits.values());
  }

  async getAll() {
    // Populate family_member_id (full_name) only
    const visits = await this.visitModel
      .find()
      .populate('family_member_id', 'full_name')
      .populate('resident_id', 'full_name')
      .exec();

    // Nhóm các visits có cùng thời gian và family member
    const groupedVisits = new Map();
    
    visits.forEach(visit => {
      const visitObj = visit.toObject();
      const key = `${visitObj.family_member_id?._id}_${visitObj.visit_date}_${visitObj.visit_time}`;
      
      if (!groupedVisits.has(key)) {
        groupedVisits.set(key, {
          _id: visitObj._id, // Lấy ID của visit đầu tiên
          family_member_id: visitObj.family_member_id,
          visit_date: visitObj.visit_date,
          visit_time: visitObj.visit_time,
          duration: visitObj.duration,
          status: visitObj.status,
          purpose: visitObj.purpose,
          numberOfVisitors: visitObj.numberOfVisitors,
          notes: visitObj.notes,
          residents_name: []
        });
      }
      
      // Thêm tên resident vào danh sách
      if (visitObj.resident_id && typeof visitObj.resident_id === 'object' && 'full_name' in visitObj.resident_id) {
        const residentName = (visitObj.resident_id as { full_name: string }).full_name;
        if (!groupedVisits.get(key).residents_name.includes(residentName)) {
          groupedVisits.get(key).residents_name.push(residentName);
        }
      }
    });

    return Array.from(groupedVisits.values());
  }

  async deleteById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid visit id format');
    }
    const result = await this.visitModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Visit not found');
    }
    return { success: true, message: 'Visit deleted successfully' };
  }
}
