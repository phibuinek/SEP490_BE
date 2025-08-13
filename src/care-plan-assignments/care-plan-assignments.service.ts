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
        .populate('staff_id', 'full_name email')
        .populate('resident_id', 'full_name date_of_birth gender care_level')
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
      return await this.carePlanAssignmentModel
        .find({ status })
        .populate('staff_id', 'full_name email')
        .populate('resident_id', 'full_name date_of_birth gender care_level')
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
      throw new BadRequestException(
        `Failed to fetch care plan assignments by status: ${error.message}`,
      );
    }
  }

  async getUnregisteredResidents(): Promise<any[]> {
    try {
      console.log('DEBUG - Getting unregistered residents...');
      
      // Get all residents
      const allResidents = await this.residentModel.find().exec();
      console.log('DEBUG - Total residents found:', allResidents.length);
      
      // Get all care plan assignments (unpopulated to get raw ObjectIds)
      const allAssignments = await this.carePlanAssignmentModel.find().lean().exec();
      console.log('DEBUG - Total assignments found:', allAssignments.length);
      
      // Get list of resident IDs that already have care plan assignments
      // Filter out assignments with null/undefined resident_id
      const registeredResidentIds = allAssignments
        .filter(assignment => assignment.resident_id) // Only include assignments with valid resident_id
        .map(assignment => assignment.resident_id.toString());
      
      console.log('DEBUG - Registered resident IDs:', registeredResidentIds);
      
      // Filter out residents who already have care plan assignments
      const unregisteredResidents = allResidents.filter((resident: any) => {
        if (!resident || !resident._id) {
          console.log('DEBUG - Skipping resident with invalid _id');
          return false;
        }
        
        const residentId = resident._id.toString();
        const isRegistered = registeredResidentIds.includes(residentId);
        console.log(`DEBUG - Resident ${resident.full_name || 'Unknown'} (${residentId}): ${isRegistered ? 'REGISTERED' : 'UNREGISTERED'}`);
        return !isRegistered;
      });
      
      console.log('DEBUG - Unregistered residents count:', unregisteredResidents.length);
      console.log('DEBUG - Unregistered residents:', unregisteredResidents.map((r: any) => r.full_name || 'Unknown'));
      
      return unregisteredResidents;
    } catch (error: any) {
      console.error('DEBUG - Error in getUnregisteredResidents:', error);
      throw new BadRequestException(
        `Failed to fetch unregistered residents: ${error.message}`,
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

  /**
   * Renew a paused care plan assignment by updating its start date, end date and reactivating it
   * This creates a new service cycle starting from the specified start date or current date
   * @param selectedCarePlanIds Optional array of care plan IDs to renew. If not provided, all care plans will be renewed.
   */
  async removePackage(id: string, packageId: string): Promise<CarePlanAssignment> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid assignment ID format');
      }
      if (!Types.ObjectId.isValid(packageId)) {
        throw new BadRequestException('Invalid package ID format');
      }

      // Find the assignment
      const assignment = await this.carePlanAssignmentModel.findById(id);
      if (!assignment) {
        throw new NotFoundException(`Care plan assignment with ID ${id} not found`);
      }

      // Check if package exists in the assignment
      const packageObjectId = new Types.ObjectId(packageId);
      const packageIndex = assignment.care_plan_ids.findIndex(
        (cp: Types.ObjectId) => cp.equals(packageObjectId)
      );

      if (packageIndex === -1) {
        throw new BadRequestException(`Package with ID ${packageId} not found in this assignment`);
      }

      // Remove the package
      assignment.care_plan_ids.splice(packageIndex, 1);
      assignment.updated_at = new Date();

      // If no packages left, delete the assignment
      if (assignment.care_plan_ids.length === 0) {
        await this.carePlanAssignmentModel.findByIdAndDelete(id);
        return assignment;
      }

      // Save the updated assignment
      const updatedAssignment = await assignment.save();
      
      // Populate the response
      const populatedAssignment = await this.carePlanAssignmentModel
        .findById(updatedAssignment._id)
        .populate('staff_id', 'name email')
        .populate('resident_id', 'name date_of_birth')
        .populate('family_member_id', 'name email')
        .populate('care_plan_ids', 'name description price')
        .populate('assigned_room_id', 'room_number floor')
        .populate('assigned_bed_id', 'bed_number')
        .exec();

      if (!populatedAssignment) {
        throw new NotFoundException(`Failed to populate updated assignment with ID ${updatedAssignment._id}`);
      }

      return populatedAssignment;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove package: ${error.message}`);
    }
  }

  async renewAssignment(id: string, newEndDate: string, newStartDate?: string, selectedCarePlanIds?: string[]): Promise<CarePlanAssignment> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid ID format');
      }

      // Validate the assignment exists and is paused
      const assignment = await this.carePlanAssignmentModel.findById(id);
      if (!assignment) {
        throw new NotFoundException(
          `Care plan assignment with ID ${id} not found`,
        );
      }

      if (assignment.status !== 'paused') {
        throw new BadRequestException('Only paused assignments can be renewed');
      }

      // Validate the new end date
      const newEndDateObj = new Date(newEndDate);
      const now = new Date();
      
      if (newEndDateObj <= now) {
        throw new BadRequestException('New end date must be in the future');
      }

      // Validate and set the new start date
      let newStartDateObj: Date;
      if (newStartDate) {
        newStartDateObj = new Date(newStartDate);
        if (newStartDateObj >= newEndDateObj) {
          throw new BadRequestException('Start date must be before end date');
        }
        if (newStartDateObj < now) {
          throw new BadRequestException('Start date cannot be in the past');
        }
      } else {
        newStartDateObj = now; // Default to current date
      }

      // If specific care plans are selected for renewal, create a new assignment for those plans
      if (selectedCarePlanIds && selectedCarePlanIds.length > 0) {
        // Validate that all selected care plan IDs exist in the current assignment
        const validCarePlanIds = assignment.care_plan_ids.map(id => id.toString());
        const invalidCarePlanIds = selectedCarePlanIds.filter(id => !validCarePlanIds.includes(id));
        
        if (invalidCarePlanIds.length > 0) {
          throw new BadRequestException(
            `Invalid care plan IDs: ${invalidCarePlanIds.join(', ')}`
          );
        }

        // Create a new assignment for the selected care plans
        const newAssignment = new this.carePlanAssignmentModel({
          staff_id: assignment.staff_id,
          resident_id: assignment.resident_id,
          family_member_id: assignment.family_member_id,
          registration_date: new Date(),
          selected_room_type: assignment.selected_room_type,
          assigned_room_id: assignment.assigned_room_id,
          assigned_bed_id: assignment.assigned_bed_id,
          family_preferences: assignment.family_preferences,
          total_monthly_cost: assignment.total_monthly_cost,
          room_monthly_cost: assignment.room_monthly_cost,
          care_plans_monthly_cost: assignment.care_plans_monthly_cost,
          start_date: newStartDateObj,
          end_date: newEndDateObj,
          additional_medications: assignment.additional_medications,
          status: 'active',
          notes: `Renewed from assignment ${id} - Selected care plans: ${selectedCarePlanIds.join(', ')}`,
          care_plan_ids: selectedCarePlanIds.map(id => new Types.ObjectId(id))
        });

        const savedNewAssignment = await newAssignment.save();
        
        // Populate the new assignment
        const populatedNewAssignment = await this.carePlanAssignmentModel
          .findById(savedNewAssignment._id)
          .populate('staff_id', 'name email')
          .populate('resident_id', 'name date_of_birth')
          .populate('family_member_id', 'name email')
          .populate('care_plan_ids', 'name description price')
          .populate('assigned_room_id', 'room_number floor')
          .populate('assigned_bed_id', 'bed_number')
          .exec();

        if (!populatedNewAssignment) {
          throw new NotFoundException(
            `Failed to populate newly created assignment with ID ${savedNewAssignment._id}`,
          );
        }

        return populatedNewAssignment;
      } else {
        // Renew all care plans in the existing assignment
        const updatedAssignment = await this.carePlanAssignmentModel
          .findByIdAndUpdate(
            id,
            { 
              start_date: newStartDateObj,
              end_date: newEndDateObj,
              status: 'active',
              updated_at: new Date() 
            },
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
      }
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to renew assignment: ${error.message}`,
      );
    }
  }
}
