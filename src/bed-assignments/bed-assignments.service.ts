import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BedAssignment,
  BedAssignmentDocument,
} from './schemas/bed-assignment.schema';
import { Bed, BedDocument } from '../beds/schemas/bed.schema';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';

@Injectable()
export class BedAssignmentsService {
  constructor(
    @InjectModel(BedAssignment.name)
    private model: Model<BedAssignmentDocument>,
    @InjectModel(Bed.name)
    private bedModel: Model<BedDocument>,
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
  ) {}

  async create(dto: any) {
    // Validate ObjectIds in dto
    if (dto.resident_id && !Types.ObjectId.isValid(dto.resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }
    if (dto.bed_id && !Types.ObjectId.isValid(dto.bed_id)) {
      throw new BadRequestException('Invalid bed_id format');
    }
    if (dto.assigned_by && !Types.ObjectId.isValid(dto.assigned_by)) {
      throw new BadRequestException('Invalid assigned_by format');
    }

    // Convert to ObjectIds
    const createData = {
      ...dto,
      resident_id: dto.resident_id
        ? new Types.ObjectId(dto.resident_id)
        : undefined,
      bed_id: dto.bed_id ? new Types.ObjectId(dto.bed_id) : undefined,
      assigned_by: dto.assigned_by
        ? new Types.ObjectId(dto.assigned_by)
        : undefined,
      assigned_date: new Date(Date.now() + 7 * 60 * 60 * 1000), // set ngày hiện tại GMT+7
      unassigned_date: null, // luôn set null khi tạo mới
      // Mặc định: pending cho đến khi thanh toán xong
      status: 'pending',
    };

    const result = await this.model.create(createData);

    // No auto-activation on creation since status is now 'pending'
    // Status will be updated to 'completed' or 'active' when payment is successful

    await this.updateBedAndRoomStatus(createData.bed_id);
    return result;
  }

  async findAll(
    bed_id?: string,
    resident_id?: string,
    activeOnly: boolean = true,
  ) {
    const matchFilter: any = {};

    if (bed_id) {
      if (!Types.ObjectId.isValid(bed_id)) {
        throw new BadRequestException('Invalid bed_id format');
      }
      matchFilter.bed_id = new Types.ObjectId(bed_id);
    }

    if (resident_id) {
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException('Invalid resident_id format');
      }
      matchFilter.resident_id = new Types.ObjectId(resident_id);
    }

    // Mặc định chỉ lấy những assignment đang hoạt động (chỉ status 'active')
    if (activeOnly) {
      matchFilter.status = 'active';
    }

    return this.model
      .aggregate([
        {
          $match: matchFilter
        },
        {
          $lookup: {
            from: 'residents',
            localField: 'resident_id',
            foreignField: '_id',
            as: 'resident_id',
            pipeline: [
              {
                $project: {
                  full_name: 1,
                  date_of_birth: 1,
                  gender: 1,
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$resident_id'
        },
        {
          $lookup: {
            from: 'beds',
            localField: 'bed_id',
            foreignField: '_id',
            as: 'bed_id',
            pipeline: [
              {
                $project: {
                  bed_number: 1,
                  bed_type: 1,
                  room_id: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$bed_id'
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'bed_id.room_id',
            foreignField: '_id',
            as: 'room',
            pipeline: [
              {
                $project: {
                  room_number: 1,
                  room_type: 1,
                  floor: 1,
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$room'
        },
        {
          $lookup: {
            from: 'room_types',
            localField: 'room.room_type',
            foreignField: 'room_type',
            as: 'room_type_info'
          }
        },
        {
          $unwind: '$room_type_info'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assigned_by',
            foreignField: '_id',
            as: 'assigned_by',
            pipeline: [
              {
                $project: {
                  full_name: 1,
                  email: 1
                }
              }
            ]
          }
        },
        {
          $unwind: { path: '$assigned_by', preserveNullAndEmptyArrays: true }
        },
        {
          $addFields: {
            'bed_id.room_id': '$room',
            'bed_id.room_id.room_type_info': '$room_type_info'
          }
        },
        {
          $project: {
            room: 0,
            room_type_info: 0
          }
        },
        {
          $sort: { assigned_date: -1 }
        }
      ])
      .exec();
  }

  // Method mới để lấy tất cả bed assignments với tất cả trạng thái
  async findAllWithAllStatuses(bed_id?: string, resident_id?: string) {
    const matchFilter: any = {};

    if (bed_id) {
      if (!Types.ObjectId.isValid(bed_id)) {
        throw new BadRequestException('Invalid bed_id format');
      }
      matchFilter.bed_id = new Types.ObjectId(bed_id);
    }

    if (resident_id) {
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException('Invalid resident_id format');
      }
      matchFilter.resident_id = new Types.ObjectId(resident_id);
    }

    // Không filter theo status - hiển thị tất cả trạng thái
    return this.model
      .aggregate([
        {
          $match: matchFilter
        },
        {
          $lookup: {
            from: 'residents',
            localField: 'resident_id',
            foreignField: '_id',
            as: 'resident_id',
            pipeline: [
              {
                $project: {
                  full_name: 1,
                  date_of_birth: 1,
                  gender: 1,
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$resident_id'
        },
        {
          $lookup: {
            from: 'beds',
            localField: 'bed_id',
            foreignField: '_id',
            as: 'bed_id',
            pipeline: [
              {
                $project: {
                  bed_number: 1,
                  bed_type: 1,
                  room_id: 1,
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$bed_id'
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'bed_id.room_id',
            foreignField: '_id',
            as: 'room',
            pipeline: [
              {
                $project: {
                  room_number: 1,
                  room_type: 1,
                  floor: 1,
                  gender: 1,
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$room'
        },
        {
          $lookup: {
            from: 'room_types',
            localField: 'room.room_type',
            foreignField: 'room_type',
            as: 'room_type_info'
          }
        },
        {
          $unwind: '$room_type_info'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assigned_by',
            foreignField: '_id',
            as: 'assigned_by',
            pipeline: [
              {
                $project: {
                  full_name: 1,
                  email: 1
                }
              }
            ]
          }
        },
        {
          $unwind: { path: '$assigned_by', preserveNullAndEmptyArrays: true }
        },
        {
          $addFields: {
            'bed_id.room_id': '$room',
            'bed_id.room_id.room_type_info': '$room_type_info'
          }
        },
        {
          $project: {
            room: 0,
            room_type_info: 0
          }
        },
        {
          $sort: { assigned_date: -1 }
        }
      ])
      .exec();
  }


  async unassign(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid assignment ID format');
    }
    const assignment = await this.model.findByIdAndUpdate(
      id,
      { 
        status: 'discharged',
        unassigned_date: new Date() 
      },
      { new: true },
    );
    if (assignment) {
      await this.updateBedAndRoomStatus(assignment.bed_id);
    }
    return assignment;
  }

  async updateBedAndRoomStatus(bed_id: Types.ObjectId) {
    // 1. Cập nhật trạng thái bed
    const activeAssignment = await this.model.findOne({
      bed_id,
      status: 'active',
    });
    const bedStatus = activeAssignment ? 'occupied' : 'available';
    await this.bedModel.findByIdAndUpdate(bed_id, { status: bedStatus });

    // 2. Cập nhật trạng thái room chứa bed này
    const bed = await this.bedModel.findById(bed_id);
    if (bed) {
      const allBeds = await this.bedModel.find({ room_id: bed.room_id });
      const allOccupied = await Promise.all(
        allBeds.map(async (b) => {
          const a = await this.model.findOne({
            bed_id: b._id,
            status: 'active',
          });
          return !!a;
        }),
      );
      const roomStatus = allOccupied.every(Boolean) ? 'occupied' : 'available';
      await this.roomModel.findByIdAndUpdate(bed.room_id, {
        status: roomStatus,
      });
    }
  }

  /**
   * Lấy tất cả bed assignments (bao gồm cả đã unassign) cho admin/staff
   */
  async findAllIncludingInactive(bed_id?: string, resident_id?: string) {
    return this.findAll(bed_id, resident_id, false); // activeOnly = false
  }

  // Find assignments by bed_id with specific statuses (minimal projection)
  async findByBedIdWithStatuses(bed_id: string, statuses: string[] = []) {
    if (!Types.ObjectId.isValid(bed_id)) {
      throw new BadRequestException('Invalid bed_id format');
    }
    const filter: any = { bed_id: new Types.ObjectId(bed_id) };
    if (Array.isArray(statuses) && statuses.length > 0) {
      filter.status = { $in: statuses };
    }
    return this.model
      .find(filter)
      .select('_id status assigned_date unassigned_date')
      .sort({ assigned_date: -1 })
      .lean()
      .exec();
  }

  // Admin methods for bed assignment approval
  async getPendingBedAssignments() {
    try {
      return await this.model
        .find({ status: 'pending' })
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('bed_id', 'bed_number')
        .populate('assigned_by', 'name email')
        .sort({ assigned_date: -1 })
        .exec();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get pending bed assignments: ${error.message}`,
      );
    }
  }

  async approveBedAssignment(assignmentId: string, adminId: string) {
    try {
      const assignment = await this.model.findById(assignmentId);
      if (!assignment) {
        throw new BadRequestException('Bed assignment not found');
      }

      if (assignment.status !== 'pending') {
        throw new BadRequestException('Only pending bed assignments can be approved');
      }

      // Update bed assignment status to accepted
      const updatedAssignment = await this.model
        .findByIdAndUpdate(
          assignmentId,
          {
            status: 'accepted',
            assigned_by: new Types.ObjectId(adminId),
          },
          { new: true, runValidators: true }
        )
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('bed_id', 'bed_number')
        .populate('assigned_by', 'name email')
        .exec();

      return updatedAssignment;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to approve bed assignment: ${error.message}`,
      );
    }
  }

  async rejectBedAssignment(assignmentId: string, adminId: string, reason?: string) {
    try {
      const assignment = await this.model.findById(assignmentId);
      if (!assignment) {
        throw new BadRequestException('Bed assignment not found');
      }

      if (assignment.status !== 'pending') {
        throw new BadRequestException('Only pending bed assignments can be rejected');
      }

      // Update bed assignment status to rejected
      const updatedAssignment = await this.model
        .findByIdAndUpdate(
          assignmentId,
          {
            status: 'rejected',
            assigned_by: new Types.ObjectId(adminId),
            reason: reason || 'Bed assignment rejected by admin',
          },
          { new: true, runValidators: true }
        )
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('bed_id', 'bed_number')
        .populate('assigned_by', 'name email')
        .exec();

      return updatedAssignment;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to reject bed assignment: ${error.message}`,
      );
    }
  }

  async activateBedAssignment(assignmentId: string) {
    try {
      const assignment = await this.model.findById(assignmentId);
      if (!assignment) {
        throw new BadRequestException('Bed assignment not found');
      }

      if (assignment.status !== 'accepted') {
        throw new BadRequestException('Only accepted bed assignments can be activated');
      }

      // Update bed assignment status to active
      const updatedAssignment = await this.model
        .findByIdAndUpdate(
          assignmentId,
          { status: 'active' },
          { new: true, runValidators: true }
        )
        .populate('resident_id', 'full_name date_of_birth cccd_id')
        .populate('bed_id', 'bed_number')
        .populate('assigned_by', 'name email')
        .exec();

      if (!updatedAssignment) {
        throw new BadRequestException('Failed to activate bed assignment');
      }

      return updatedAssignment;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to activate bed assignment: ${error.message}`,
      );
    }
  }

  // Method to automatically activate completed assignments when admission date arrives
  async activateCompletedAssignmentsByAdmissionDate(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      // Find all completed assignments where admission date is today or earlier
      const completedAssignments = await this.model
        .find({
          status: 'completed',
        })
        .populate('resident_id', 'admission_date')
        .exec();

      for (const assignment of completedAssignments) {
        const resident = assignment.resident_id as any;
        if (resident && resident.admission_date) {
          const admissionDate = new Date(resident.admission_date);
          admissionDate.setHours(0, 0, 0, 0);

          // If admission date is today or earlier, activate the assignment
          if (admissionDate <= today) {
            await this.model.findByIdAndUpdate(assignment._id, {
              status: 'active',
            });

            // Update bed and room status
            await this.updateBedAndRoomStatus(assignment.bed_id);
          }
        }
      }
    } catch (error) {
      console.error('Error activating completed assignments:', error);
    }
  }

  // Method to get assignments by status
  async getAssignmentsByStatus(status: string): Promise<any[]> {
    return this.model
      .find({ status })
      .populate('resident_id', 'full_name date_of_birth cccd_id admission_date')
      .populate('bed_id', 'bed_number bed_type room_id')
      .populate('assigned_by', 'name email')
      .sort({ assigned_date: -1 })
      .exec();
  }

  // Method to get all bed assignments for a specific resident (all statuses)
  async findByResidentId(resident_id: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new BadRequestException('Invalid resident_id format');
    }

    return this.model
      .aggregate([
        {
          $match: { resident_id: new Types.ObjectId(resident_id) }
        },
        {
          $lookup: {
            from: 'residents',
            localField: 'resident_id',
            foreignField: '_id',
            as: 'resident_id',
            pipeline: [
              {
                $project: {
                  full_name: 1,
                  date_of_birth: 1,
                  cccd_id: 1,
                  admission_date: 1,
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$resident_id'
        },
        {
          $lookup: {
            from: 'beds',
            localField: 'bed_id',
            foreignField: '_id',
            as: 'bed_id',
            pipeline: [
              {
                $project: {
                  bed_number: 1,
                  bed_type: 1,
                  room_id: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$bed_id'
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'bed_id.room_id',
            foreignField: '_id',
            as: 'room',
            pipeline: [
              {
                $project: {
                  room_number: 1,
                  room_type: 1,
                  floor: 1,
                  status: 1
                }
              }
            ]
          }
        },
        {
          $unwind: '$room'
        },
        {
          $lookup: {
            from: 'room_types',
            localField: 'room.room_type',
            foreignField: 'room_type',
            as: 'room_type_info'
          }
        },
        {
          $unwind: '$room_type_info'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assigned_by',
            foreignField: '_id',
            as: 'assigned_by',
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1
                }
              }
            ]
          }
        },
        {
          $unwind: { path: '$assigned_by', preserveNullAndEmptyArrays: true }
        },
        {
          $addFields: {
            'bed_id.room_id': '$room',
            'bed_id.room_id.room_type_info': '$room_type_info'
          }
        },
        {
          $project: {
            room: 0,
            room_type_info: 0
          }
        },
        {
          $sort: { assigned_date: -1 }
        }
      ])
      .exec();
  }
}
