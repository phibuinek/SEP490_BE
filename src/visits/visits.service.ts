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
    return this.visitModel.create(data);
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
    
    return this.visitModel.find({ 
      family_member_id: new Types.ObjectId(family_member_id)
    })
    .populate('family_member_id', 'full_name username')
    .sort({ visit_date: -1, visit_time: -1 })
    .exec();
  }

  async getAll() {
    // Populate family_member_id (full_name) only
    const visits = await this.visitModel
      .find()
      .populate('family_member_id', 'full_name')
      .exec();

    // For each visit, find all residents with the same family_member_id
    const ResidentModel = this.visitModel.db.model('Resident');
    const visitsWithResidents = await Promise.all(
      visits.map(async (visit) => {
        const residents = await ResidentModel.find({ family_member_id: visit.family_member_id?._id })
          .select('full_name')
          .exec();
        let familyMemberName: string | undefined = undefined;
        if (visit.family_member_id && typeof visit.family_member_id === 'object' && 'full_name' in visit.family_member_id) {
          familyMemberName = (visit.family_member_id as { full_name: string }).full_name;
        }
        return {
          ...visit.toObject(),
          residents_name: residents.map(r => r.full_name),
        };
      })
    );
    return visitsWithResidents;
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
