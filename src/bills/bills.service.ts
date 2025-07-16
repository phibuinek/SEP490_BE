import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from './schemas/bill.schema';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CarePlansService } from '../care-plans/care-plans.service';
import { Types } from 'mongoose';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    private readonly carePlansService: CarePlansService,
  ) {}

  async create(createBillDto: CreateBillDto): Promise<Bill> {
    const carePlan = await this.carePlansService.findOne(
      createBillDto.care_plan_id.toString(),
    );

    if (!carePlan) {
      throw new NotFoundException(
        `CarePlan with ID "${createBillDto.care_plan_id}" not found`,
      );
    }

    const newBill = new this.billModel({
      ...createBillDto,
      amount: carePlan.monthly_price,
      bill_date: new Date(),
      care_plan_snapshot: {
        plan_name: carePlan.plan_name,
        monthly_price: carePlan.monthly_price,
        plan_type: carePlan.plan_type,
        description: carePlan.description,
        staff_ratio: carePlan.staff_ratio,
        category: carePlan.category,
      },
    });

    return newBill.save();
  }

  async findAll(): Promise<Bill[]> {
    return this.billModel.find().exec();
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billModel.findById(id).exec();
    if (!bill) {
      throw new NotFoundException(`Bill #${id} not found`);
    }
    return bill;
  }

  async update(id: string, updateBillDto: UpdateBillDto): Promise<Bill> {
    const bill = await this.billModel
      .findByIdAndUpdate(id, updateBillDto, { new: true })
      .exec();
    if (!bill) {
      throw new NotFoundException(`Bill #${id} not found`);
    }
    return bill;
  }

  async remove(id: string): Promise<Bill> {
    const bill = await this.billModel.findByIdAndDelete(id).exec();
    if (!bill) {
      throw new NotFoundException(`Bill #${id} not found`);
    }
    return bill;
  }

  async findByResidentId(resident_id: string): Promise<Bill[]> {
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new BadRequestException('Invalid resident ID format');
    }
    
    return this.billModel
      .find({ resident_id: new Types.ObjectId(resident_id) })
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .sort({ due_date: -1 })
      .exec();
  }
}
