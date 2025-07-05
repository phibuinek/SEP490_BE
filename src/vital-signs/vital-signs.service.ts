import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VitalSign, VitalSignDocument } from './schemas/vital-sign.schema';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';

@Injectable()
export class VitalSignsService {
  constructor(
    @InjectModel(VitalSign.name) private vitalSignModel: Model<VitalSignDocument>,
  ) {}

  async create(createDto: CreateVitalSignDto, userId: string): Promise<VitalSign> {
    const createdVitalSign = new this.vitalSignModel({
      ...createDto,
      recordedBy: userId,
    });
    return createdVitalSign.save();
  }

  async findAll(): Promise<VitalSign[]> {
    return this.vitalSignModel.find();
  }

  async findAllByResidentId(residentId: string): Promise<VitalSign[]> {
    return this.vitalSignModel.find({ residentId: residentId }).exec();
  }

  async findOne(id: string): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findById(id);
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }

  async update(id: string, updateDto: UpdateVitalSignDto): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findByIdAndUpdate(id, updateDto, { new: true });
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }

  async remove(id: string): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findByIdAndDelete(id);
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }
} 