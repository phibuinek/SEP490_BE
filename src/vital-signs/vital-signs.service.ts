import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VitalSign, VitalSignDocument } from './schemas/vital-sign.schema';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { StaffAssignment, StaffAssignmentDocument } from '../staff-assignments/schemas/staff-assignment.schema';

@Injectable()
export class VitalSignsService {
  constructor(
    @InjectModel(VitalSign.name)
    private vitalSignModel: Model<VitalSignDocument>,
    @InjectModel(StaffAssignment.name)
    private staffAssignmentModel: Model<StaffAssignmentDocument>,
  ) {}

  async create(
    createDto: CreateVitalSignDto,
    user_id: string,
  ): Promise<VitalSign> {
    console.log('Creating vital sign with:', { createDto, user_id });
    try {
      // Validate that at least one vital sign value is provided
      const hasVitalSignValues = createDto.temperature || createDto.heart_rate || createDto.blood_pressure || 
                                createDto.respiratory_rate || createDto.oxygen_level || createDto.weight;
      
      if (!hasVitalSignValues) {
        throw new Error('Phải có ít nhất một chỉ số sinh hiệu');
      }

      // Clean up the data - remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(createDto).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      const createdVitalSign = new this.vitalSignModel({
        ...cleanData,
        resident_id: new Types.ObjectId(createDto.resident_id),
        recorded_by: new Types.ObjectId(user_id),
        date_time: new Date(Date.now() + 7 * 60 * 60 * 1000), // GMT+7
      });
      
      const result = await createdVitalSign.save();
      console.log('Created vital sign result:', result);
      return result;
    } catch (err) {
      console.error('Error saving vital sign:', err);
      
      // Handle specific MongoDB errors
      if (err.code === 11000) {
        throw new Error('Chỉ số sinh hiệu đã tồn tại');
      }
      
      if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map((e: any) => e.message);
        throw new Error(`Lỗi validation: ${validationErrors.join(', ')}`);
      }
      
      if (err.name === 'CastError') {
        throw new Error('Dữ liệu không đúng định dạng');
      }
      
      throw err;
    }
  }

  async findAll(): Promise<VitalSign[]> {
    return this.vitalSignModel.find();
  }

  async findAllByStaffId(staff_id: string): Promise<VitalSign[]> {
    // Get all residents assigned to this staff
    const assignments = await this.staffAssignmentModel.find({
      staff_id: new Types.ObjectId(staff_id),
      status: 'active',
    });
    
    const residentIds = assignments.map(assignment => assignment.resident_id);
    
    if (residentIds.length === 0) {
      return [];
    }
    
    // Get vital signs for all assigned residents
    return this.vitalSignModel.find({
      resident_id: { $in: residentIds }
    })
    .populate({
      path: 'recorded_by',
      select: 'full_name position',
    })
    .populate({
      path: 'resident_id',
      select: 'full_name date_of_birth gender',
    })
    .exec();
  }

  async findAllByResidentId(resident_id: string): Promise<VitalSign[]> {
    // Convert string to ObjectId and use correct field name from DB
    return this.vitalSignModel.find({ 
      resident_id: new Types.ObjectId(resident_id) 
    })
    .populate({
      path: 'recorded_by',
      select: 'full_name position',
    })
    .exec();
  }

  async findOne(id: string): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findById(id);
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }

  async update(id: string, updateDto: UpdateVitalSignDto): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findByIdAndUpdate(id, updateDto, {
      new: true,
    });
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }

  async remove(id: string): Promise<VitalSign> {
    const vital = await this.vitalSignModel.findByIdAndDelete(id);
    if (!vital) throw new NotFoundException('Vital sign not found');
    return vital;
  }
}
