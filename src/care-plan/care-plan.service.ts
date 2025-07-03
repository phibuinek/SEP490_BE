import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarePlan, CarePlanDocument } from './schemas/care-plan.schema';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';

@Injectable()
export class CarePlanService {
  constructor(
    @InjectModel(CarePlan.name) private carePlanModel: Model<CarePlanDocument>,
  ) {}

  async create(createDto: CreateCarePlanDto): Promise<CarePlan> {
    return this.carePlanModel.create(createDto);
  }

  async findAll(): Promise<CarePlan[]> {
    return this.carePlanModel.find();
  }

  async findOne(id: string): Promise<CarePlan> {
    const plan = await this.carePlanModel.findById(id);
    if (!plan) throw new NotFoundException('Care plan not found');
    return plan;
  }

  async update(id: string, updateDto: UpdateCarePlanDto): Promise<CarePlan> {
    const plan = await this.carePlanModel.findByIdAndUpdate(id, updateDto, { new: true });
    if (!plan) throw new NotFoundException('Care plan not found');
    return plan;
  }

  async remove(id: string): Promise<CarePlan> {
    const plan = await this.carePlanModel.findByIdAndDelete(id);
    if (!plan) throw new NotFoundException('Care plan not found');
    return plan;
  }
} 