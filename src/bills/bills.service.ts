import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from './schemas/bill.schema';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CarePlansService } from '../care-plans/care-plans.service';
import { Types } from 'mongoose';
import { ResidentsService } from '../residents/residents.service';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    private readonly carePlansService: CarePlansService,
    private readonly residentsService: ResidentsService,
  ) {}

  async create(createBillDto: CreateBillDto): Promise<Bill> {
    const toVNDate = (d: Date | string | undefined) => d ? new Date(new Date(d).getTime() + 7 * 60 * 60 * 1000) : undefined;
    // Lấy family_member_id từ resident_id
    const resident = await this.residentsService.findOne(createBillDto.resident_id.toString());
    if (!resident) throw new NotFoundException('Resident not found');
    const newBill = new this.billModel({
      ...createBillDto,
      family_member_id: resident.family_member_id,
      due_date: toVNDate(createBillDto.due_date),
      status: 'pending',
      payment_method: 'qr_payment',
      paid_date: null,
    });
    try {
      return await newBill.save();
    } catch (err) {
      // Log chi tiết lỗi MongoDB
      console.error('MongoDB Error when creating bill:', err);
      if (err.name === 'MongoServerError' && err.code === 121) {
        // Lỗi document failed validation
        throw new BadRequestException({
          message: 'MongoDB validation error',
          details: err.errInfo?.details || err.errmsg || err.message,
        });
      }
      throw err;
    }
  }

  async findAll(): Promise<Bill[]> {
    return this.billModel.find().exec();
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billModel.findById(id)
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select: 'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .exec();
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
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select: 'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .sort({ due_date: -1 })
      .exec();
  }

  async findByFamilyMemberId(family_member_id: string): Promise<Bill[]> {
    if (!Types.ObjectId.isValid(family_member_id)) {
      throw new BadRequestException('Invalid family member ID format');
    }
    return this.billModel
      .find({ family_member_id: new Types.ObjectId(family_member_id) })
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select: 'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .sort({ due_date: -1 })
      .exec();
  }
}
