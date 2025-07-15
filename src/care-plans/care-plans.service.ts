import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CarePlan, CarePlanDocument } from './schemas/care-plan.schema';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';
import {
  Resident,
  ResidentDocument,
} from '../residents/schemas/resident.schema';

@Injectable()
export class CarePlansService {
  constructor(
    @InjectModel(CarePlan.name) private carePlanModel: Model<CarePlanDocument>,
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
  ) {}

  async create(createCarePlanDto: CreateCarePlanDto): Promise<CarePlan> {
    const createdCarePlan = new this.carePlanModel(createCarePlanDto);
    return createdCarePlan.save();
  }

  async findAll(): Promise<CarePlan[]> {
    return this.carePlanModel.find().exec();
  }

  async findOne(id: string): Promise<CarePlan> {
    const carePlan = await this.carePlanModel.findById(id).exec();
    if (!carePlan) {
      throw new NotFoundException(`CarePlan with ID "${id}" not found`);
    }
    return carePlan;
  }

  async update(
    id: string,
    updateCarePlanDto: UpdateCarePlanDto,
  ): Promise<CarePlan> {
    const existingCarePlan = await this.carePlanModel
      .findByIdAndUpdate(id, updateCarePlanDto, { new: true })
      .exec();
    if (!existingCarePlan) {
      throw new NotFoundException(`CarePlan with ID "${id}" not found`);
    }
    return existingCarePlan;
  }

  async remove(id: string): Promise<CarePlan> {
    const deletedCarePlan = await this.carePlanModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedCarePlan) {
      throw new NotFoundException(`CarePlan with ID "${id}" not found`);
    }
    return deletedCarePlan;
  }
}
