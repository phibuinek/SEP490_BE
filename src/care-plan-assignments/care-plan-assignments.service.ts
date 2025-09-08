import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CarePlanAssignment } from './schemas/care-plan-assignment.schema';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
import { BillsService } from '../bills/bills.service';
import { BillStatus, PaymentMethod } from '../bills/schemas/bill.schema';
import { CarePlan, CarePlanDocument } from '../care-plans/schemas/care-plan.schema';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
// import { Schema } from 'mongoose'; // phải import cả Schema

@Injectable()
export class CarePlanAssignmentsService {
  constructor(
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<CarePlanAssignment>,
    @InjectModel(CarePlan.name)
    private carePlanModel: Model<CarePlanDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
    private readonly billsService: BillsService,
  ) {}

  async create(
    createCarePlanAssignmentDto: CreateCarePlanAssignmentDto,
    _req?: any,
  ): Promise<CarePlanAssignment> {
    // 1. Lấy thông tin CarePlan
    const carePlan = await this.carePlanModel.findById(createCarePlanAssignmentDto.care_plan_id);
    if (!carePlan) throw new NotFoundException('CarePlan not found');

    // 2. Lấy thông tin Resident
    const resident = await this.residentModel.findById(createCarePlanAssignmentDto.resident_id);
    if (!resident) throw new NotFoundException('Resident not found');

    // 3. Tạo assignment
    const createdCarePlanAssignment = new this.carePlanAssignmentModel({
      ...createCarePlanAssignmentDto,
      care_plan_name: carePlan.planName,
    });
    const savedAssignment = await createdCarePlanAssignment.save();

    // 4. Tạo Bill tương ứng
    await this.billsService.create({
      family_member_id: resident.familyMemberId
        ? new Types.ObjectId(resident.familyMemberId) as Schema.Types.ObjectId
        : undefined,
      resident_id: new Types.ObjectId(resident._id) as Schema.Types.ObjectId,
      care_plan_assignment_id: new Types.ObjectId(savedAssignment._id) as Schema.Types.ObjectId,
      staff_id: new Types.ObjectId(createCarePlanAssignmentDto.staff_id) as Schema.Types.ObjectId,
      amount: carePlan.monthlyPrice,
      due_date: new Date(createCarePlanAssignmentDto.start_date),
      paid_date: '',
      payment_method: PaymentMethod.BANK_TRANSFER,
      status: BillStatus.UNPAID,
      notes: `Thanh toán cho gói dịch vụ: ${carePlan.planName}`,
    });

    return savedAssignment;
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