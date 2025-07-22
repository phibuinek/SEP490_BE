import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bed, BedDocument } from './schemas/bed.schema';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class BedsService {
  constructor(
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
    @InjectModel(BedAssignment.name) private bedAssignmentModel: Model<BedAssignmentDocument>,
  ) {}

  async create(createBedDto: CreateBedDto): Promise<Bed> {
    if (!Types.ObjectId.isValid(createBedDto.room_id)) {
      throw new BadRequestException('room_id không hợp lệ');
    }
    const data = {
      ...createBedDto,
      room_id: new Types.ObjectId(createBedDto.room_id),
    };
    return this.bedModel.create(data);
  }

  async findAll(): Promise<any[]> {
    const beds = await this.bedModel.find().lean();
    const result: any[] = [];
    for (const bed of beds) {
      const assignment = await this.bedAssignmentModel.findOne({ bed_id: bed._id, unassigned_date: null });
      let dynamicStatus = bed.status;
      if (assignment) dynamicStatus = 'occupied';
      result.push({ ...bed, status: dynamicStatus });
    }
    return result;
  }

  async findOne(id: string): Promise<Bed | null> {
    return this.bedModel.findById(id).exec();
  }

  async update(id: string, updateBedDto: UpdateBedDto): Promise<Bed | null> {
    return this.bedModel
      .findByIdAndUpdate(id, updateBedDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.bedModel.findByIdAndDelete(id).exec();
  }

  async findByRoomIdWithStatus(room_id: string, status?: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(room_id)) return [];
    const beds = await this.bedModel.find({ room_id: new Types.ObjectId(room_id) }).lean();
    const result: any[] = [];
    for (const bed of beds) {
      const assignment = await this.bedAssignmentModel.findOne({ bed_id: bed._id, unassigned_date: null });
      let dynamicStatus = bed.status;
      if (assignment) dynamicStatus = 'occupied';
      // Nếu có filter status thì chỉ trả về bed phù hợp
      if (!status || dynamicStatus === status) {
        result.push({ ...bed, status: dynamicStatus });
      }
    }
    return result;
  }
}
