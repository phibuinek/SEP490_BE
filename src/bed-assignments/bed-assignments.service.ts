import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BedAssignment, BedAssignmentDocument } from './schemas/bed-assignment.schema';

@Injectable()
export class BedAssignmentsService {
  constructor(
    @InjectModel(BedAssignment.name) private model: Model<BedAssignmentDocument>
  ) {}

  async create(dto: any) {
    return this.model.create(dto);
  }

  async findAll(bed_id?: string, resident_id?: string) {
    const filter: any = {};
    if (bed_id) filter.bed_id = bed_id;
    if (resident_id) filter.resident_id = resident_id;
    return this.model.find(filter).exec();
  }

  async unassign(id: string) {
    return this.model.findByIdAndUpdate(id, { unassigned_date: new Date() }, { new: true });
  }
} 