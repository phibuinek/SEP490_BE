import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BedAssignment,
  BedAssignmentDocument,
} from './schemas/bed-assignment.schema';

@Injectable()
export class BedAssignmentsService {
  constructor(
    @InjectModel(BedAssignment.name)
    private model: Model<BedAssignmentDocument>,
  ) {}

  async create(dto: any) {
    // Validate ObjectIds in dto
    if (dto.resident_id && !Types.ObjectId.isValid(dto.resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }
    if (dto.bed_id && !Types.ObjectId.isValid(dto.bed_id)) {
      throw new BadRequestException('Invalid bed_id format');
    }
    if (dto.assigned_by && !Types.ObjectId.isValid(dto.assigned_by)) {
      throw new BadRequestException('Invalid assigned_by format');
    }

    // Convert to ObjectIds
    const createData = {
      ...dto,
      resident_id: dto.resident_id ? new Types.ObjectId(dto.resident_id) : undefined,
      bed_id: dto.bed_id ? new Types.ObjectId(dto.bed_id) : undefined,
      assigned_by: dto.assigned_by ? new Types.ObjectId(dto.assigned_by) : undefined,
    };

    return this.model.create(createData);
  }

  async findAll(bed_id?: string, resident_id?: string) {
    const filter: any = {};
    
    if (bed_id) {
      if (!Types.ObjectId.isValid(bed_id)) {
        throw new BadRequestException('Invalid bed_id format');
      }
      filter.bed_id = new Types.ObjectId(bed_id);
    }
    
    if (resident_id) {
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException('Invalid resident_id format');
      }
      filter.resident_id = new Types.ObjectId(resident_id);
    }
    
    return this.model
      .find(filter)
      .populate('resident_id', 'full_name')
      .populate({
        path: 'bed_id',
        select: 'bed_number room_id',
        populate: {
          path: 'room_id',
          select: 'room_number',
        },
      })
      .populate('assigned_by', 'full_name')
      .sort({ assigned_date: -1 })
      .exec();
  }

  async unassign(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assignment ID format');
    }
    
    return this.model.findByIdAndUpdate(
      id,
      { unassigned_date: new Date() },
      { new: true },
    );
  }
}
