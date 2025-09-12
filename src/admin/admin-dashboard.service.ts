import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resident, ResidentDocument, ResidentStatus } from '../residents/schemas/resident.schema';
import { CarePlanAssignment, CarePlanAssignmentDocument } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';
import { RegistrationPackage, RegistrationPackageDocument, RegistrationPackageStatus } from '../registration-packages/schemas/registration-package.schema';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<CarePlanAssignmentDocument>,
    @InjectModel(BedAssignment.name)
    private bedAssignmentModel: Model<BedAssignmentDocument>,
    @InjectModel(RegistrationPackage.name)
    private registrationPackageModel: Model<RegistrationPackageDocument>,
  ) {}

  async getPendingRegistrations() {
    try {
      // Get pending registration packages (complete registration sets)
      const pendingRegistrationPackages = await this.registrationPackageModel
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

      // Get individual pending items (for backward compatibility)
      const [pendingResidents, pendingCarePlanAssignments, pendingBedAssignments] = await Promise.all([
        // Pending residents (not part of any package)
        this.residentModel
          .find({ 
            status: ResidentStatus.PENDING,
            is_deleted: false,
            _id: { $nin: pendingRegistrationPackages.map(pkg => pkg.resident_id) }
          })
          .populate('family_member_id', 'name email phone')
          .sort({ created_at: -1 })
          .exec(),

        // Pending care plan assignments (not part of any package)
        this.carePlanAssignmentModel
          .find({ 
            status: 'pending',
            _id: { $nin: pendingRegistrationPackages.map(pkg => pkg.care_plan_assignment_id) }
          })
          .populate('resident_id', 'full_name date_of_birth cccd_id')
          .populate('family_member_id', 'name email phone')
          .populate('care_plan_ids', 'name description price')
          .sort({ created_at: -1 })
          .exec(),

        // Pending bed assignments (not part of any package)
        this.bedAssignmentModel
          .find({ 
            status: 'pending',
            _id: { $nin: pendingRegistrationPackages.map(pkg => pkg.bed_assignment_id) }
          })
          .populate('resident_id', 'full_name date_of_birth cccd_id')
          .populate('bed_id', 'bed_number')
          .populate('assigned_by', 'name email')
          .sort({ assigned_date: -1 })
          .exec(),
      ]);

      return {
        pending_registration_packages: pendingRegistrationPackages,
        pending_residents: pendingResidents,
        pending_care_plan_assignments: pendingCarePlanAssignments,
        pending_bed_assignments: pendingBedAssignments,
        summary: {
          total_pending_packages: pendingRegistrationPackages.length,
          total_pending_residents: pendingResidents.length,
          total_pending_care_plan_assignments: pendingCarePlanAssignments.length,
          total_pending_bed_assignments: pendingBedAssignments.length,
          total_pending: pendingRegistrationPackages.length + pendingResidents.length + pendingCarePlanAssignments.length + pendingBedAssignments.length,
        }
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get pending registrations: ${error.message}`,
      );
    }
  }

  async getDashboardStatistics() {
    try {
      const [
        totalResidents,
        activeResidents,
        pendingResidents,
        acceptedResidents,
        rejectedResidents,
        totalCarePlanAssignments,
        activeCarePlanAssignments,
        pendingCarePlanAssignments,
        acceptedCarePlanAssignments,
        rejectedCarePlanAssignments,
        totalBedAssignments,
        activeBedAssignments,
        pendingBedAssignments,
        acceptedBedAssignments,
        rejectedBedAssignments,
      ] = await Promise.all([
        // Resident statistics
        this.residentModel.countDocuments({ is_deleted: false }),
        this.residentModel.countDocuments({ status: ResidentStatus.ACTIVE, is_deleted: false }),
        this.residentModel.countDocuments({ status: ResidentStatus.PENDING, is_deleted: false }),
        this.residentModel.countDocuments({ status: ResidentStatus.ACCEPTED, is_deleted: false }),
        this.residentModel.countDocuments({ status: ResidentStatus.REJECTED, is_deleted: false }),

        // Care plan assignment statistics
        this.carePlanAssignmentModel.countDocuments(),
        this.carePlanAssignmentModel.countDocuments({ status: 'active' }),
        this.carePlanAssignmentModel.countDocuments({ status: 'pending' }),
        this.carePlanAssignmentModel.countDocuments({ status: 'accepted' }),
        this.carePlanAssignmentModel.countDocuments({ status: 'rejected' }),

        // Bed assignment statistics
        this.bedAssignmentModel.countDocuments(),
        this.bedAssignmentModel.countDocuments({ status: 'active' }),
        this.bedAssignmentModel.countDocuments({ status: 'pending' }),
        this.bedAssignmentModel.countDocuments({ status: 'accepted' }),
        this.bedAssignmentModel.countDocuments({ status: 'rejected' }),
      ]);

      return {
        residents: {
          total: totalResidents,
          active: activeResidents,
          pending: pendingResidents,
          accepted: acceptedResidents,
          rejected: rejectedResidents,
        },
        care_plan_assignments: {
          total: totalCarePlanAssignments,
          active: activeCarePlanAssignments,
          pending: pendingCarePlanAssignments,
          accepted: acceptedCarePlanAssignments,
          rejected: rejectedCarePlanAssignments,
        },
        bed_assignments: {
          total: totalBedAssignments,
          active: activeBedAssignments,
          pending: pendingBedAssignments,
          accepted: acceptedBedAssignments,
          rejected: rejectedBedAssignments,
        },
        summary: {
          total_pending_approvals: pendingResidents + pendingCarePlanAssignments + pendingBedAssignments,
          total_active_residents: activeResidents,
          total_active_assignments: activeCarePlanAssignments + activeBedAssignments,
        }
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get dashboard statistics: ${error.message}`,
      );
    }
  }
}
