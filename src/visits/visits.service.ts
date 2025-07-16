import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Visit } from './visit.schema';

@Injectable()
export class VisitsService {
  constructor(@InjectModel(Visit.name) private visitModel: Model<Visit>) {}

  async create(data: any) {
    // Convert family_member_id to ObjectId if it's a string
    if (data.family_member_id && typeof data.family_member_id === 'string') {
      if (!Types.ObjectId.isValid(data.family_member_id)) {
        throw new Error('Invalid family_member_id format');
      }
      data.family_member_id = new Types.ObjectId(data.family_member_id);
    }
    
    // Add default status if not provided
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
    }).exec();
  }
}
