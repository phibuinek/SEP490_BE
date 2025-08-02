import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  StaffAssignment,
  StaffAssignmentDocument,
  AssignmentStatus,
} from './schemas/staff-assignment.schema';
import { CreateStaffAssignmentDto } from './dto/create-staff-assignment.dto';
import { UpdateStaffAssignmentDto } from './dto/update-staff-assignment.dto';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class StaffAssignmentsService {
  constructor(
    @InjectModel(StaffAssignment.name)
    private staffAssignmentModel: Model<StaffAssignmentDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async create(
    createStaffAssignmentDto: CreateStaffAssignmentDto,
    req: any,
  ): Promise<StaffAssignment> {
    try {
      const { staff_id, resident_id } = createStaffAssignmentDto;
      const admin_id = req.user.user_id;

      // Validate staff exists and is actually a staff
      const staff = await this.userModel.findById(staff_id);
      if (!staff) {
        throw new NotFoundException('Staff not found');
      }
      if (staff.role !== 'staff') {
        throw new BadRequestException('User is not a staff member');
      }

      // Validate resident exists
      const resident = await this.residentModel.findById(resident_id);
      if (!resident) {
        throw new NotFoundException('Resident not found');
      }

      // Check if active assignment already exists
      const existingActiveAssignment = await this.staffAssignmentModel.findOne({
        staff_id: new Types.ObjectId(staff_id),
        resident_id: new Types.ObjectId(resident_id),
        status: AssignmentStatus.ACTIVE,
      });

      if (existingActiveAssignment) {
        throw new ConflictException('Staff is already actively assigned to this resident');
      }

      // If there's an expired assignment, update it instead of creating a new one
      const existingExpiredAssignment = await this.staffAssignmentModel.findOne({
        staff_id: new Types.ObjectId(staff_id),
        resident_id: new Types.ObjectId(resident_id),
        status: AssignmentStatus.EXPIRED,
      });

      if (existingExpiredAssignment) {
        // Update the expired assignment to active
        const updatedAssignment = await this.staffAssignmentModel
          .findByIdAndUpdate(
            existingExpiredAssignment._id,
            {
              assigned_by: new Types.ObjectId(admin_id),
              assigned_date: new Date(),
              end_date: createStaffAssignmentDto.end_date
                ? new Date(createStaffAssignmentDto.end_date)
                : null,
              status: AssignmentStatus.ACTIVE,
              responsibilities: createStaffAssignmentDto.responsibilities || [
                'vital_signs',
                'care_notes',
                'activities',
                'photos',
              ],
              notes: createStaffAssignmentDto.notes || null,
              updated_at: new Date(),
            },
            { new: true }
          )
          .populate('staff_id', 'full_name email role avatar')
          .populate('resident_id', 'full_name date_of_birth gender phone emergency_contact medical_conditions allergies avatar')
          .populate('assigned_by', 'full_name email')
          .exec();

        if (!updatedAssignment) {
          throw new BadRequestException('Failed to update expired assignment');
        }

        return updatedAssignment;
      }

      const createdAssignment = new this.staffAssignmentModel({
        ...createStaffAssignmentDto,
        staff_id: new Types.ObjectId(staff_id),
        resident_id: new Types.ObjectId(resident_id),
        assigned_by: new Types.ObjectId(admin_id),
        assigned_date: new Date(),
        end_date: createStaffAssignmentDto.end_date
          ? new Date(createStaffAssignmentDto.end_date)
          : null,
        status: createStaffAssignmentDto.status || AssignmentStatus.ACTIVE,
        responsibilities: createStaffAssignmentDto.responsibilities || [
          'vital_signs',
          'care_notes',
          'activities',
          'photos',
        ],
        created_at: new Date(),
        updated_at: new Date(),
      });

      const savedAssignment = await createdAssignment.save();
      
      // Populate the saved assignment with related data
      const populatedAssignment = await this.staffAssignmentModel
        .findById(savedAssignment._id)
        .populate('staff_id', 'full_name email role avatar')
        .populate('resident_id', 'full_name date_of_birth gender phone emergency_contact medical_conditions allergies avatar')
        .populate('assigned_by', 'full_name email')
        .exec();
        
      if (!populatedAssignment) {
        throw new BadRequestException('Failed to populate created assignment');
      }
      
      return populatedAssignment;
    } catch (error: any) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create staff assignment: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<StaffAssignment[]> {
    try {
      // Tự động cập nhật status cho các assignment đã hết hạn
      const now = new Date();
      await this.staffAssignmentModel.updateMany(
        {
          status: AssignmentStatus.ACTIVE,
          end_date: { $lt: now, $ne: null }
        },
        {
          $set: { 
            status: 'expired',
            updated_at: now
          }
        }
      );

      return await this.staffAssignmentModel
        .find({ status: AssignmentStatus.ACTIVE }) // Chỉ lấy những assignment còn active
        .populate('staff_id', 'full_name email role avatar')
        .populate('resident_id', 'full_name date_of_birth gender avatar')
        .populate('assigned_by', 'full_name email')
        .exec();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch staff assignments: ${error.message}`,
      );
    }
  }

  async findAllIncludingExpired(): Promise<StaffAssignment[]> {
    try {
      // Tự động cập nhật status cho các assignment đã hết hạn
      const now = new Date();
      await this.staffAssignmentModel.updateMany(
        {
          status: AssignmentStatus.ACTIVE,
          end_date: { $lt: now, $ne: null }
        },
        {
          $set: { 
            status: 'expired',
            updated_at: now
          }
        }
      );

      return await this.staffAssignmentModel
        .find() // Lấy tất cả assignment (bao gồm cả expired)
        .populate('staff_id', 'full_name email role avatar')
        .populate('resident_id', 'full_name date_of_birth gender avatar')
        .populate('assigned_by', 'full_name email')
        .exec();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch all staff assignments: ${error.message}`,
      );
    }
  }

  async findOne(id: string): Promise<StaffAssignment> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid assignment ID format');
      }

      const assignment = await this.staffAssignmentModel
        .findById(id)
        .populate('staff_id', 'full_name email role avatar')
        .populate('resident_id', 'full_name date_of_birth gender avatar')
        .populate('assigned_by', 'full_name email')
        .exec();

      if (!assignment) {
        throw new NotFoundException('Staff assignment not found');
      }

      return assignment;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch staff assignment: ${error.message}`,
      );
    }
  }

  async findByStaff(staff_id: string): Promise<StaffAssignment[]> {
    try {
      if (!Types.ObjectId.isValid(staff_id)) {
        throw new BadRequestException('Invalid staff ID format');
      }

      return await this.staffAssignmentModel
        .find({ 
          staff_id: new Types.ObjectId(staff_id)
          // Removed status filter to show all assignments
        })
        .populate('staff_id', 'full_name email role avatar')
        .populate('resident_id', 'full_name date_of_birth gender phone emergency_contact medical_conditions allergies avatar')
        .populate('assigned_by', 'full_name email')
        .exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch staff assignments for staff: ${error.message}`,
      );
    }
  }

  async findByResident(resident_id: string): Promise<StaffAssignment[]> {
    try {
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException('Invalid resident ID format');
      }

      return await this.staffAssignmentModel
        .find({ 
          resident_id: new Types.ObjectId(resident_id),
          status: AssignmentStatus.ACTIVE
        })
        .populate('staff_id', 'full_name email role avatar')
        .populate('resident_id', 'full_name date_of_birth gender avatar')
        .populate('assigned_by', 'full_name email')
        .exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch staff assignments for resident: ${error.message}`,
      );
    }
  }

  async findResidentById(resident_id: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException('Invalid resident ID format');
      }

      return await this.residentModel.findById(resident_id).exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch resident: ${error.message}`,
      );
    }
  }

  async update(
    id: string,
    updateStaffAssignmentDto: UpdateStaffAssignmentDto,
  ): Promise<StaffAssignment> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid assignment ID format');
      }

      const assignment = await this.staffAssignmentModel.findById(id);
      if (!assignment) {
        throw new NotFoundException('Staff assignment not found');
      }

      // If updating staff_id or resident_id, check for conflicts
      if (updateStaffAssignmentDto.staff_id || updateStaffAssignmentDto.resident_id) {
        const staff_id = updateStaffAssignmentDto.staff_id || assignment.staff_id.toString();
        const resident_id = updateStaffAssignmentDto.resident_id || assignment.resident_id.toString();

        const existingAssignment = await this.staffAssignmentModel.findOne({
          staff_id: new Types.ObjectId(staff_id),
          resident_id: new Types.ObjectId(resident_id),
          _id: { $ne: new Types.ObjectId(id) },
          status: AssignmentStatus.ACTIVE,
        });

        if (existingAssignment) {
          throw new ConflictException('Staff is already assigned to this resident');
        }
      }

      const updatedAssignment = await this.staffAssignmentModel
        .findByIdAndUpdate(
          id,
          {
            ...updateStaffAssignmentDto,
            staff_id: updateStaffAssignmentDto.staff_id 
              ? new Types.ObjectId(updateStaffAssignmentDto.staff_id)
              : undefined,
            resident_id: updateStaffAssignmentDto.resident_id
              ? new Types.ObjectId(updateStaffAssignmentDto.resident_id)
              : undefined,
            end_date: updateStaffAssignmentDto.end_date
              ? new Date(updateStaffAssignmentDto.end_date)
              : undefined,
            updated_at: new Date(),
          },
          { new: true }
        )
        .populate('staff_id', 'full_name email role avatar')
        .populate('resident_id', 'full_name date_of_birth gender avatar')
        .populate('assigned_by', 'full_name email')
        .exec();

      if (!updatedAssignment) {
        throw new NotFoundException('Staff assignment not found after update');
      }

      return updatedAssignment;
    } catch (error: any) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update staff assignment: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid assignment ID format');
      }

      const assignment = await this.staffAssignmentModel.findById(id);
      if (!assignment) {
        throw new NotFoundException('Staff assignment not found');
      }

      await this.staffAssignmentModel.findByIdAndDelete(id);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete staff assignment: ${error.message}`,
      );
    }
  }


} 