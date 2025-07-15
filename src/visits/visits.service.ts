import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visit } from './visit.schema';

@Injectable()
export class VisitsService {
  constructor(@InjectModel(Visit.name) private visitModel: Model<Visit>) {}

  async create(data: any) {
    return this.visitModel.create(data);
  }

  async getByResident(family_member_id: string, resident_id: string) {
    return this.visitModel.find({ family_member_id, resident_id }).exec();
  }

  async getByFamily(family_member_id: string) {
    return this.visitModel.find({ family_member_id }).exec();
  }
}
