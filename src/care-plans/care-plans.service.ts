import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CarePlan, CarePlanDocument } from './schemas/care-plan.schema';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';

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
    const deletedCarePlan = await this.carePlanModel.findByIdAndDelete(id).exec();
    if (!deletedCarePlan) {
      throw new NotFoundException(`CarePlan with ID "${id}" not found`);
    }
    return deletedCarePlan;
  }

  async findByFamilyId(familyId: string): Promise<CarePlan[]> {
    // Lấy tất cả resident thuộc familyId
    const residents = await this.residentModel.find({ familyMemberId: familyId }).exec();
    const carePlanIds = residents.map(r => r.carePlanId).filter(Boolean);
    if (carePlanIds.length === 0) return [];
    // Lấy tất cả care plan tương ứng
    return this.carePlanModel.find({ _id: { $in: carePlanIds } }).exec();
  }

  async assignCarePlanToResident(carePlanId: string, residentId: string) {
    try {
      console.log('Service params:', { carePlanId, residentId });
      
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(residentId)) {
        throw new Error('Invalid resident ID format');
      }
      if (!Types.ObjectId.isValid(carePlanId)) {
        throw new Error('Invalid care plan ID format');
      }

      // Convert to ObjectId
      const residentObjectId = new Types.ObjectId(residentId);
      const carePlanObjectId = new Types.ObjectId(carePlanId);

      // Check if care plan exists
      const carePlan = await this.carePlanModel.findById(carePlanObjectId);
      if (!carePlan) {
        throw new Error('Care plan not found');
      }

      // Find and update resident
      const resident = await this.residentModel.findById(residentObjectId);
      console.log('Resident found:', resident);
      if (!resident) {
        throw new Error('Resident not found');
      }

      resident.carePlanId = carePlanObjectId;
      await resident.save();
      
      return { message: 'Care plan assigned to resident successfully.' };
    } catch (err) {
      console.error('Error when assigning carePlanId:', err);
      throw err;
    }
  }
} 