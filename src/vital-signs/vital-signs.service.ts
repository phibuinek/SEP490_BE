import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VitalSign, VitalSignDocument } from './schemas/vital-sign.schema';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';

@Injectable()
export class VitalSignsService {
  constructor(
    @InjectModel(VitalSign.name)
    private vitalSignModel: Model<VitalSignDocument>,
  ) {}

  async create(
    createDto: CreateVitalSignDto,
    user_id: string,
  ): Promise<VitalSign> {
    console.log('Creating vital sign with:', { createDto, user_id });
    try {
      const createdVitalSign = new this.vitalSignModel({
        ...createDto,
        resident_id: new Types.ObjectId(createDto.resident_id),
        recorded_by: new Types.ObjectId(user_id),
        date_time: new Date(Date.now() + 7 * 60 * 60 * 1000),
      });
      const result = await createdVitalSign.save();
      console.log('Created vital sign result:', result);
      return result;
    } catch (err) {
      console.error('Error saving vital sign:', err);
      throw err;
    }
  }

  async findAll(): Promise<VitalSign[]> {
    return this.vitalSignModel.find();
  }

  async findAllByResidentId(resident_id: string): Promise<VitalSign[]> {
    // Convert string to ObjectId and use correct field name from DB
    return this.vitalSignModel.find({
      resident_id: new Types.ObjectId(resident_id)
    })
    .populate({
      path: 'recorded_by',
      select: 'full_name position',
    })
    .exec();
  }

  async findOne(id: string): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findById(id);
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }

  async update(id: string, updateDto: UpdateVitalSignDto): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findByIdAndUpdate(id, updateDto, {
      new: true,
    });
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }

  async remove(id: string): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findByIdAndDelete(id);
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }
}
