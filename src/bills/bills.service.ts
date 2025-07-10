import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from './schemas/bill.schema';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CarePlansService } from '../care-plans/care-plans.service';

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
      amount: carePlan.monthlyPrice,
      care_plan_snapshot: {
        planName: carePlan.planName,
        description: carePlan.description,
        monthlyPrice: carePlan.monthlyPrice,
        planType: carePlan.planType,
        category: carePlan.category,
        staffRatio: carePlan.staffRatio,
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

  async findByResidentId(residentId: string): Promise<Bill[]> {
    return this.billModel.find({ resident_id: residentId }).exec();
  }
}
