import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CarePlanAssignment,
  CarePlanAssignmentDocument,
} from './schemas/care-plan-assignment.schema';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';

@Injectable()
export class CarePlanAssignmentsService {
  constructor(
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<CarePlanAssignmentDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
  ) {}

  async create(
    createCarePlanAssignmentDto: CreateCarePlanAssignmentDto,
    req: any,
  ): Promise<CarePlanAssignment> {
    
    try {
      // Lấy staff_id từ user đã login
      const staff_id = req.user.user_id;

      // Lấy resident để có family_member_id
      const resident_id = new Types.ObjectId(createCarePlanAssignmentDto.resident_id);
      const resident = await this.residentModel.findById(resident_id);
      if (!resident) {
        throw new NotFoundException('Resident not found');
      }
      const family_member_id = resident.family_member_id;

      // Lấy care_plan_ids từ dto và chuyển thành ObjectId
      const care_plan_ids = (createCarePlanAssignmentDto.care_plan_ids || []).map((id: string) => new Types.ObjectId(id));

      // Lấy assigned_room_id và assigned_bed_id từ dto và chuyển thành ObjectId
      const assigned_room_id = createCarePlanAssignmentDto.assigned_room_id ? new Types.ObjectId(createCarePlanAssignmentDto.assigned_room_id) : undefined;
      const assigned_bed_id = createCarePlanAssignmentDto.assigned_bed_id ? new Types.ObjectId(createCarePlanAssignmentDto.assigned_bed_id) : undefined;

      // Tự động set registration_date là thời gian hiện tại
      const registration_date = new Date();

      const createdAssignment = new this.carePlanAssignmentModel({
        ...createCarePlanAssignmentDto,
        resident_id,
        staff_id: new Types.ObjectId(staff_id),
        family_member_id,
        care_plan_ids,
        assigned_room_id,
        assigned_bed_id,
        registration_date,
        start_date: new Date(createCarePlanAssignmentDto.start_date),
        end_date: createCarePlanAssignmentDto.end_date
          ? new Date(createCarePlanAssignmentDto.end_date)
          : undefined,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return await createdAssignment.save();
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create care plan assignment: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<CarePlanAssignment[]> {
    try {
      return await this.carePlanAssignmentModel
        .find()
        .populate('staff_id', 'name email')
        .populate('resident_id', 'name date_of_birth')
        .populate('family_member_id', 'name email')
        .populate('care_plan_ids', 'name description price')
        .populate('assigned_room_id', 'room_number floor')
        .populate('assigned_bed_id', 'bed_number')
        .sort({ created_at: -1 })
        .exec();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch care plan assignments: ${error.message}`,
      );
    }
  }

  async findOne(id: string): Promise<CarePlanAssignment> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid ID format');
      }

      const assignment = await this.carePlanAssignmentModel
        .findById(id)
        .populate('staff_id', 'name email')
        .populate('resident_id', 'name date_of_birth')
        .populate('family_member_id', 'name email')
        .populate('care_plan_ids', 'name description price')
        .populate('assigned_room_id', 'room_number floor')
        .populate('assigned_bed_id', 'bed_number')
        .exec();

      if (!assignment) {
        throw new NotFoundException(
          `Care plan assignment with ID ${id} not found`,
        );
      }

      return assignment;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch care plan assignment: ${error.message}`,
      );
    }
  }

  async findByResident(resident_id: string): Promise<CarePlanAssignment[]> {
    try {
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException('Invalid resident ID format');
      }

      return await this.carePlanAssignmentModel
        .find({ resident_id: new Types.ObjectId(resident_id) })
        .populate('staff_id', 'full_name email')
        .populate('care_plan_ids', 'plan_name monthly_price')
        .populate('resident_id', 'full_name')
        .populate('family_member_id', 'full_name email')
        .exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch care plan assignments for resident: ${error.message}`,
      );
    }
  }

  async findByFamilyMember(
    familyMemberId: string,
  ): Promise<CarePlanAssignment[]> {
    try {
      if (!Types.ObjectId.isValid(familyMemberId)) {
        throw new BadRequestException('Invalid family member ID format');
      }

      return await this.carePlanAssignmentModel
        .find({ family_member_id: new Types.ObjectId(familyMemberId) })
        .populate('staff_id', 'full_name email')
        .populate('resident_id', 'full_name date_of_birth gender')
        .populate('family_member_id', 'full_name email')
        .populate({
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included staff_ratio duration_type prerequisites contraindications is_active',
        })
        .populate('assigned_room_id', 'room_number floor room_type')
        .populate('assigned_bed_id', 'bed_number bed_type')
        .sort({ created_at: -1 })
        .exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch care plan assignments for family member: ${error.message}`,
      );
    }
  }

  async findByStatus(status: string): Promise<CarePlanAssignment[]> {
    try {
      const validStatuses = [
        'consulting',
        'packages_selected',
        'room_assigned',
        'payment_completed',
        'active',
        'completed',
        'cancelled',
        'paused',
      ];

      if (!validStatuses.includes(status)) {
        throw new BadRequestException('Invalid status value');
      }

      return await this.carePlanAssignmentModel
        .find({ status })
        .populate('staff_id', 'name email')
        .populate('resident_id', 'name date_of_birth')
        .populate('family_member_id', 'name email')
        .populate('care_plan_ids', 'name description price')
        .populate('assigned_room_id', 'room_number floor')
        .populate('assigned_bed_id', 'bed_number')
        .sort({ created_at: -1 })
        .exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch care plan assignments by status: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateCarePlanAssignmentDto: UpdateCarePlanAssignmentDto,
  ): Promise<CarePlanAssignment> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid ID format');
      }

      // Handle date conversions
      const updateData: any = { ...updateCarePlanAssignmentDto };
      if (updateData.registration_date) {
        updateData.registration_date = new Date(updateData.registration_date);
      }
      if (updateData.start_date) {
        updateData.start_date = new Date(updateData.start_date);
      }
      if (updateData.end_date) {
        updateData.end_date = new Date(updateData.end_date);
      }
      updateData.updated_at = new Date();

      const updatedAssignment = await this.carePlanAssignmentModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('staff_id', 'name email')
        .populate('resident_id', 'name date_of_birth')
        .populate('family_member_id', 'name email')
        .populate('care_plan_ids', 'name description price')
        .populate('assigned_room_id', 'room_number floor')
        .populate('assigned_bed_id', 'bed_number')
        .exec();

      if (!updatedAssignment) {
        throw new NotFoundException(
          `Care plan assignment with ID ${id} not found`,
        );
      }

      return updatedAssignment;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update care plan assignment: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<{ deleted: boolean; _id: string }> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid ID format');
      }

      const deletedAssignment = await this.carePlanAssignmentModel
        .findByIdAndDelete(id)
        .exec();

      if (!deletedAssignment) {
        throw new NotFoundException(
          `Care plan assignment with ID ${id} not found`,
        );
      }

      return { deleted: true, _id: id };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete care plan assignment: ${error.message}`,
      );
    }
  }

  async updateStatus(id: string, status: string): Promise<CarePlanAssignment> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid ID format');
      }

      const validStatuses = [
        'consulting',
        'packages_selected',
        'room_assigned',
        'payment_completed',
        'active',
        'completed',
        'cancelled',
        'paused',
      ];

      if (!validStatuses.includes(status)) {
        throw new BadRequestException('Invalid status value');
      }

      const updatedAssignment = await this.carePlanAssignmentModel
        .findByIdAndUpdate(
          id,
          { status, updated_at: new Date() },
          { new: true, runValidators: true },
        )
        .populate('staff_id', 'name email')
        .populate('resident_id', 'name date_of_birth')
        .populate('family_member_id', 'name email')
        .populate('care_plan_ids', 'name description price')
        .populate('assigned_room_id', 'room_number floor')
        .populate('assigned_bed_id', 'bed_number')
        .exec();

      if (!updatedAssignment) {
        throw new NotFoundException(
          `Care plan assignment with ID ${id} not found`,
        );
      }

      return updatedAssignment;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update status: ${error.message}`,
      );
    }
  }
}
