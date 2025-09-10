import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CarePlanAssignment } from './schemas/care-plan-assignment.schema';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
// import { BillsService } from '../bills/bills.service';
// import { BillStatus, PaymentMethod } from '../bills/schemas/bill.schema';
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
    // private readonly billsService: BillsService,
  ) {}

  async create(
    createCarePlanAssignmentDto: CreateCarePlanAssignmentDto,
    _req?: any,
  ): Promise<CarePlanAssignment> {
    // 1. Lấy thông tin CarePlan
    // Hỗ trợ cả care_plan_id (single) và care_plan_ids (array) để tương thích
    const carePlanId: any = (createCarePlanAssignmentDto as any).care_plan_id ||
      (Array.isArray((createCarePlanAssignmentDto as any).care_plan_ids)
        ? (createCarePlanAssignmentDto as any).care_plan_ids[0]
        : undefined);
    if (!carePlanId) {
      throw new NotFoundException('care_plan_id hoặc care_plan_ids[0] là bắt buộc');
    }
    const carePlan = await this.carePlanModel.findById(carePlanId);
    if (!carePlan) throw new NotFoundException('CarePlan not found');

    // 2. Lấy thông tin Resident
    const resident = await this.residentModel.findById(
      createCarePlanAssignmentDto.resident_id,
    );
    if (!resident) throw new NotFoundException('Resident not found');

    // 3. Tạo assignment
    const createdCarePlanAssignment = new this.carePlanAssignmentModel({
      ...createCarePlanAssignmentDto,
      care_plan_name: carePlan.plan_name,
    });
    const savedAssignment = await createdCarePlanAssignment.save();

    // TODO: Tạo Bill tương ứng (tạm thời comment để tránh circular dependency)
    // await this.billsService.create({
    //   resident_id: new Types.ObjectId(String((resident as any)._id)),
    //   care_plan_assignment_id: new Types.ObjectId(String((savedAssignment as any)._id)),
    //   staff_id: new Types.ObjectId(String((createCarePlanAssignmentDto as any).staff_id)),
    //   amount: carePlan.monthly_price,
    //   due_date: new Date(createCarePlanAssignmentDto.start_date),
    //   title: `Hóa đơn gói dịch vụ: ${carePlan.plan_name}`,
    //   notes: `Thanh toán cho gói dịch vụ: ${carePlan.plan_name}`,
    // } as any);

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

  async findByResident(resident_id: string): Promise<CarePlanAssignment[]> {
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new NotFoundException('Invalid resident ID');
    }
    return this.carePlanAssignmentModel
      .find({ resident_id: new Types.ObjectId(resident_id) })
      .exec();
  }
} 