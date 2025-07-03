import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarePlanAssignment } from './schemas/care-plan-assignment.schema';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';

@Injectable()
export class CarePlanAssignmentsService {
  constructor(
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<CarePlanAssignment>,
  ) {}

  async create(
    createCarePlanAssignmentDto: CreateCarePlanAssignmentDto,
  ): Promise<CarePlanAssignment> {
    const createdCarePlanAssignment = new this.carePlanAssignmentModel(
      createCarePlanAssignmentDto,
    );
    return createdCarePlanAssignment.save();
  }

  async findAll(): Promise<CarePlanAssignment[]> {
    return this.carePlanAssignmentModel.find().exec();
  }

  async findOne(id: string): Promise<CarePlanAssignment> {
    const carePlanAssignment = await this.carePlanAssignmentModel
      .findById(id)
      .exec();
    if (!carePlanAssignment) {
      throw new NotFoundException(`CarePlanAssignment #${id} not found`);
    }
    return carePlanAssignment;
  }

  async update(
    id: string,
    updateCarePlanAssignmentDto: UpdateCarePlanAssignmentDto,
  ): Promise<CarePlanAssignment> {
    const carePlanAssignment = await this.carePlanAssignmentModel
      .findByIdAndUpdate(id, updateCarePlanAssignmentDto, { new: true })
      .exec();
    if (!carePlanAssignment) {
      throw new NotFoundException(`CarePlanAssignment #${id} not found`);
    }
    return carePlanAssignment;
  }

  async remove(id: string): Promise<CarePlanAssignment> {
    const carePlanAssignment = await this.carePlanAssignmentModel
      .findByIdAndDelete(id)
      .exec();
    if (!carePlanAssignment) {
      throw new NotFoundException(`CarePlanAssignment #${id} not found`);
    }
    return carePlanAssignment;
  }
} 