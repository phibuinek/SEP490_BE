import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RegistrationPackage,
  RegistrationPackageDocument,
  RegistrationPackageStatus,
} from './schemas/registration-package.schema';
import { CreateRegistrationPackageDto } from './dto/create-registration-package.dto';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
import { CarePlanAssignment, CarePlanAssignmentDocument } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';

@Injectable()
export class RegistrationPackagesService {
  constructor(
    @InjectModel(RegistrationPackage.name)
    private registrationPackageModel: Model<RegistrationPackageDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<CarePlanAssignmentDocument>,
    @InjectModel(BedAssignment.name)
    private bedAssignmentModel: Model<BedAssignmentDocument>,
  ) {}

  async create(
    createRegistrationPackageDto: CreateRegistrationPackageDto,
    familyMemberId: string,
  ): Promise<RegistrationPackage> {
    try {
      // Validate that all referenced entities exist and belong to the same family
      const [resident, carePlanAssignment, bedAssignment] = await Promise.all([
        this.residentModel.findById(createRegistrationPackageDto.resident_id),
        this.carePlanAssignmentModel.findById(createRegistrationPackageDto.care_plan_assignment_id),
        this.bedAssignmentModel.findById(createRegistrationPackageDto.bed_assignment_id),
      ]);

      if (!resident) {
        throw new NotFoundException('Resident not found');
      }
      if (!carePlanAssignment) {
        throw new NotFoundException('Care plan assignment not found');
      }
      if (!bedAssignment) {
        throw new NotFoundException('Bed assignment not found');
      }

      // Verify that all belong to the same family member
      if (resident.family_member_id.toString() !== familyMemberId) {
        throw new BadRequestException('Resident does not belong to this family member');
      }
      if (carePlanAssignment.family_member_id?.toString() !== familyMemberId) {
        throw new BadRequestException('Care plan assignment does not belong to this family member');
      }
      if (bedAssignment.resident_id.toString() !== createRegistrationPackageDto.resident_id) {
        throw new BadRequestException('Bed assignment does not belong to this resident');
      }

      // Check if a registration package already exists for this resident
      const existingPackage = await this.registrationPackageModel.findOne({
        resident_id: new Types.ObjectId(createRegistrationPackageDto.resident_id),
        status: { $in: [RegistrationPackageStatus.PENDING, RegistrationPackageStatus.ACCEPTED] }
      });

      if (existingPackage) {
        throw new BadRequestException('A registration package already exists for this resident');
      }

      const registrationPackage = new this.registrationPackageModel({
        family_member_id: new Types.ObjectId(familyMemberId),
        resident_id: new Types.ObjectId(createRegistrationPackageDto.resident_id),
        care_plan_assignment_id: new Types.ObjectId(createRegistrationPackageDto.care_plan_assignment_id),
        bed_assignment_id: new Types.ObjectId(createRegistrationPackageDto.bed_assignment_id),
        status: RegistrationPackageStatus.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return await registrationPackage.save();
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create registration package: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<RegistrationPackage[]> {
    try {
      return await this.registrationPackageModel
        .find()
        .populate('family_member_id', 'name email phone')
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('care_plan_assignment_id')
        .populate('bed_assignment_id')
        .populate('approved_by', 'name email')
        .sort({ created_at: -1 })
        .exec();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get registration packages: ${error.message}`,
      );
    }
  }

  async getPendingPackages(): Promise<RegistrationPackage[]> {
    try {
      return await this.registrationPackageModel
        .find({ status: RegistrationPackageStatus.PENDING })
        .populate('family_member_id', 'name email phone')
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate({
          path: 'care_plan_assignment_id',
          populate: [
            { path: 'care_plan_ids', select: 'name description price' },
            { path: 'assigned_room_id', select: 'room_number floor' },
            { path: 'assigned_bed_id', select: 'bed_number' }
          ]
        })
        .populate({
          path: 'bed_assignment_id',
          populate: [
            { path: 'bed_id', select: 'bed_number' },
            { path: 'assigned_by', select: 'name email' }
          ]
        })
        .sort({ created_at: -1 })
        .exec();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get pending registration packages: ${error.message}`,
      );
    }
  }

  async approvePackage(packageId: string, adminId: string): Promise<RegistrationPackage> {
    try {
      const registrationPackage = await this.registrationPackageModel.findById(packageId);
      if (!registrationPackage) {
        throw new NotFoundException('Registration package not found');
      }

      if (registrationPackage.status !== RegistrationPackageStatus.PENDING) {
        throw new BadRequestException('Only pending packages can be approved');
      }

      // Update package status
      const updatedPackage = await this.registrationPackageModel
        .findByIdAndUpdate(
          packageId,
          {
            status: RegistrationPackageStatus.ACCEPTED,
            approved_by: new Types.ObjectId(adminId),
            approved_at: new Date(),
            updated_at: new Date(),
          },
          { new: true, runValidators: true }
        )
        .populate('family_member_id', 'name email phone')
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('care_plan_assignment_id')
        .populate('bed_assignment_id')
        .populate('approved_by', 'name email')
        .exec();

      if (!updatedPackage) {
        throw new NotFoundException('Failed to update registration package');
      }

      // Update all related entities to accepted status
      await Promise.all([
        this.residentModel.findByIdAndUpdate(
          registrationPackage.resident_id,
          { status: 'accepted' },
          { new: true }
        ),
        this.carePlanAssignmentModel.findByIdAndUpdate(
          registrationPackage.care_plan_assignment_id,
          { status: 'accepted' },
          { new: true }
        ),
        this.bedAssignmentModel.findByIdAndUpdate(
          registrationPackage.bed_assignment_id,
          { status: 'accepted' },
          { new: true }
        ),
      ]);

      return updatedPackage;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to approve registration package: ${error.message}`,
      );
    }
  }

  async rejectPackage(packageId: string, adminId: string, reason?: string): Promise<RegistrationPackage> {
    try {
      const registrationPackage = await this.registrationPackageModel.findById(packageId);
      if (!registrationPackage) {
        throw new NotFoundException('Registration package not found');
      }

      if (registrationPackage.status !== RegistrationPackageStatus.PENDING) {
        throw new BadRequestException('Only pending packages can be rejected');
      }

      // Update package status
      const updatedPackage = await this.registrationPackageModel
        .findByIdAndUpdate(
          packageId,
          {
            status: RegistrationPackageStatus.REJECTED,
            approved_by: new Types.ObjectId(adminId),
            approved_at: new Date(),
            rejection_reason: reason || 'Package rejected by admin',
            updated_at: new Date(),
          },
          { new: true, runValidators: true }
        )
        .populate('family_member_id', 'name email phone')
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('care_plan_assignment_id')
        .populate('bed_assignment_id')
        .populate('approved_by', 'name email')
        .exec();

      if (!updatedPackage) {
        throw new NotFoundException('Failed to update registration package');
      }

      // Update all related entities to rejected status
      await Promise.all([
        this.residentModel.findByIdAndUpdate(
          registrationPackage.resident_id,
          { status: 'rejected' },
          { new: true }
        ),
        this.carePlanAssignmentModel.findByIdAndUpdate(
          registrationPackage.care_plan_assignment_id,
          { status: 'rejected' },
          { new: true }
        ),
        this.bedAssignmentModel.findByIdAndUpdate(
          registrationPackage.bed_assignment_id,
          { status: 'rejected' },
          { new: true }
        ),
      ]);

      return updatedPackage;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to reject registration package: ${error.message}`,
      );
    }
  }

  async activatePackage(packageId: string): Promise<RegistrationPackage> {
    try {
      const registrationPackage = await this.registrationPackageModel.findById(packageId);
      if (!registrationPackage) {
        throw new NotFoundException('Registration package not found');
      }

      if (registrationPackage.status !== RegistrationPackageStatus.ACCEPTED) {
        throw new BadRequestException('Only accepted packages can be activated');
      }

      // Update package status
      const updatedPackage = await this.registrationPackageModel
        .findByIdAndUpdate(
          packageId,
          {
            status: RegistrationPackageStatus.ACTIVE,
            activated_at: new Date(),
            updated_at: new Date(),
          },
          { new: true, runValidators: true }
        )
        .populate('family_member_id', 'name email phone')
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('care_plan_assignment_id')
        .populate('bed_assignment_id')
        .populate('approved_by', 'name email')
        .exec();

      if (!updatedPackage) {
        throw new NotFoundException('Failed to update registration package');
      }

      // Update all related entities to active status
      await Promise.all([
        this.residentModel.findByIdAndUpdate(
          registrationPackage.resident_id,
          { status: 'active' },
          { new: true }
        ),
        this.carePlanAssignmentModel.findByIdAndUpdate(
          registrationPackage.care_plan_assignment_id,
          { status: 'active' },
          { new: true }
        ),
        this.bedAssignmentModel.findByIdAndUpdate(
          registrationPackage.bed_assignment_id,
          { status: 'active' },
          { new: true }
        ),
      ]);

      return updatedPackage;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to activate registration package: ${error.message}`,
      );
    }
  }

  async findOne(id: string): Promise<RegistrationPackage> {
    try {
      const registrationPackage = await this.registrationPackageModel
        .findById(id)
        .populate('family_member_id', 'name email phone')
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate({
          path: 'care_plan_assignment_id',
          populate: [
            { path: 'care_plan_ids', select: 'name description price' },
            { path: 'assigned_room_id', select: 'room_number floor' },
            { path: 'assigned_bed_id', select: 'bed_number' }
          ]
        })
        .populate({
          path: 'bed_assignment_id',
          populate: [
            { path: 'bed_id', select: 'bed_number' },
            { path: 'assigned_by', select: 'name email' }
          ]
        })
        .populate('approved_by', 'name email')
        .exec();

      if (!registrationPackage) {
        throw new NotFoundException('Registration package not found');
      }

      return registrationPackage;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get registration package: ${error.message}`,
      );
    }
  }
}
