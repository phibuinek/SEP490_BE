import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  OnModuleInit,
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
import {
  Resident,
  ResidentDocument,
} from '../residents/schemas/resident.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';

@Injectable()
export class StaffAssignmentsService implements OnModuleInit {
  constructor(
    @InjectModel(StaffAssignment.name)
    private staffAssignmentModel: Model<StaffAssignmentDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
    @InjectModel(BedAssignment.name)
    private bedAssignmentModel: Model<BedAssignmentDocument>,
  ) {}

  async onModuleInit() {
    try {
      // Normalize indexes to allow multiple rooms per staff, unique only per (staff_id, room_id)
      const collection = this.staffAssignmentModel.collection as any;
      const indexes = await collection.indexes();
      // Drop accidental unique index on staff_id only, if present
      for (const idx of indexes) {
        if (idx?.key && idx.key.staff_id === 1 && !idx.key.room_id && idx.unique) {
          if (idx.name) {
            await collection.dropIndex(idx.name).catch(() => undefined);
          }
        }
      }
      // Ensure compound unique index
      await collection.createIndex({ staff_id: 1, room_id: 1 }, { unique: true });
    } catch (e) {
      // Best-effort; do not block startup
    }
  }

  async create(
    createStaffAssignmentDto: CreateStaffAssignmentDto,
    req: any,
  ): Promise<StaffAssignment> {
    try {
      const { staff_id, room_id, assigned_date, assigned_by } =
        createStaffAssignmentDto;

      // Validate staff exists and is actually a staff
      const staff = await this.userModel.findById(staff_id);
      if (!staff) {
        throw new NotFoundException('Không tìm thấy thông tin nhân viên');
      }
      if (staff.role !== 'staff') {
        throw new BadRequestException('Người dùng này không phải là nhân viên');
      }

      // Validate room exists
      const room = await this.roomModel.findById(room_id);
      if (!room) {
        throw new NotFoundException('Không tìm thấy thông tin phòng');
      }

      // Capacity map by room_type
      const getCapacityForRoomType = (roomType?: string): number => {
        switch ((roomType || '').toLowerCase()) {
          case '2_bed':
          case '2-bed':
            return 2;
          case '3_bed':
          case '3-bed':
            return 3;
          case '4_5_bed':
          case '4-5_bed':
          case '4-5-bed':
            return 5;
          case '6_8_bed':
          case '6-8_bed':
          case '6-8-bed':
            return 8;
          default:
            // fallback to room.bed_count if provided, else 0
            return (room as any)?.bed_count || 0;
        }
      };

      // Enforce cumulative capacity <= 8 across all active rooms of this staff
      const existingActiveAssignments = await this.staffAssignmentModel
        .find({
          staff_id: new Types.ObjectId(staff_id),
          status: AssignmentStatus.ACTIVE,
        })
        .populate('room_id', 'room_type bed_count')
        .exec();

      const currentCapacity = existingActiveAssignments.reduce((sum, a: any) => {
        const rt = a?.room_id?.room_type;
        const cap = getCapacityForRoomType(rt);
        return sum + (Number.isFinite(cap) ? cap : 0);
      }, 0);

      const newRoomCapacity = getCapacityForRoomType((room as any)?.room_type);
      if (currentCapacity + newRoomCapacity > 8) {
        throw new BadRequestException(
          `Vượt quá giới hạn chăm sóc tối đa 8 người cho một nhân viên (hiện tại: ${currentCapacity}, phòng mới: ${newRoomCapacity}).`,
        );
      }

      // Check if active assignment already exists for this specific room
      const existingActiveAssignment = await this.staffAssignmentModel.findOne({
        staff_id: new Types.ObjectId(staff_id),
        room_id: new Types.ObjectId(room_id),
        status: AssignmentStatus.ACTIVE,
      });

      if (existingActiveAssignment) {
        throw new ConflictException(
          'Nhân viên đã được phân công cho phòng này',
        );
      }

      // If there's an expired assignment, update it instead of creating a new one
      const existingExpiredAssignment = await this.staffAssignmentModel.findOne(
        {
          staff_id: new Types.ObjectId(staff_id),
          room_id: new Types.ObjectId(room_id),
          status: AssignmentStatus.EXPIRED,
        },
      );

      if (existingExpiredAssignment) {
        // Re-activate only if capacity allows
        const reactivateRoomCapacity = newRoomCapacity;
        if (currentCapacity + reactivateRoomCapacity > 8) {
          throw new BadRequestException(
            `Vượt quá giới hạn chăm sóc tối đa 8 người khi kích hoạt lại phân công (hiện tại: ${currentCapacity}, phòng: ${reactivateRoomCapacity}).`,
          );
        }
        existingExpiredAssignment.status = AssignmentStatus.ACTIVE;
        existingExpiredAssignment.updated_at = new Date();
        return await existingExpiredAssignment.save();
      }

      // Create new assignment
      const assignment = new this.staffAssignmentModel({
        staff_id: new Types.ObjectId(staff_id),
        room_id: new Types.ObjectId(room_id),
        assigned_by: new Types.ObjectId(assigned_by),
        assigned_date: new Date(assigned_date),
        end_date: createStaffAssignmentDto.end_date
          ? new Date(createStaffAssignmentDto.end_date)
          : null,
        status: createStaffAssignmentDto.status || AssignmentStatus.ACTIVE,
        notes: createStaffAssignmentDto.notes || null,
        responsibilities: createStaffAssignmentDto.responsibilities || [],
        created_at: new Date(),
        updated_at: new Date(),
      });

      const savedAssignment = await assignment.save();
      return savedAssignment;
    } catch (error) {
      console.error('Error creating staff assignment:', error);
      throw error;
    }
  }

  // async create(
  //   createStaffAssignmentDto: CreateStaffAssignmentDto,
  //   req: any,
  // ): Promise<StaffAssignment> {
  //   try {
  //     const { staff_id, resident_id, assigned_date, assigned_by } =
  //       createStaffAssignmentDto;

  //     // Validate staff exists and is actually a staff
  //     const staff = await this.userModel.findById(staff_id);
  //     if (!staff) {
  //       throw new NotFoundException('Không tìm thấy thông tin nhân viên');
  //     }
  //     if (staff.role !== 'staff') {
  //       throw new BadRequestException('Người dùng này không phải là nhân viên');
  //     }

  //     // Validate resident exists
  //     const resident = await this.residentModel.findById(resident_id);
  //     if (!resident) {
  //       throw new NotFoundException('Không tìm thấy thông tin người cao tuổi');
  //     }

  //     // Check if active assignment already exists
  //     const existingActiveAssignment = await this.staffAssignmentModel.findOne({
  //       staff_id: new Types.ObjectId(staff_id),
  //       resident_id: new Types.ObjectId(resident_id),
  //       status: AssignmentStatus.ACTIVE,
  //     });

  //     if (existingActiveAssignment) {
  //       throw new ConflictException(
  //         'Nhân viên đã được phân công cho người cao tuổi này',
  //       );
  //     }

  //     // If there's an expired assignment, update it instead of creating a new one
  //     const existingExpiredAssignment = await this.staffAssignmentModel.findOne(
  //       {
  //         staff_id: new Types.ObjectId(staff_id),
  //         resident_id: new Types.ObjectId(resident_id),
  //         status: AssignmentStatus.EXPIRED,
  //       },
  //     );

  //     if (existingExpiredAssignment) {
  //       // Update the expired assignment to active
  //       existingExpiredAssignment.status = AssignmentStatus.ACTIVE;
  //       existingExpiredAssignment.updated_at = new Date();
  //       return await existingExpiredAssignment.save();
  //     }

  //     // Create new assignment
  //     const assignment = new this.staffAssignmentModel({
  //       staff_id: new Types.ObjectId(staff_id),
  //       resident_id: new Types.ObjectId(resident_id),
  //       assigned_by: new Types.ObjectId(assigned_by),
  //       assigned_date: new Date(assigned_date),
  //       end_date: createStaffAssignmentDto.end_date
  //         ? new Date(createStaffAssignmentDto.end_date)
  //         : null,
  //       status: createStaffAssignmentDto.status || AssignmentStatus.ACTIVE,
  //       notes: createStaffAssignmentDto.notes || null,
  //       responsibilities: createStaffAssignmentDto.responsibilities || [],
  //       created_at: new Date(),
  //       updated_at: new Date(),
  //     });

  //     const savedAssignment = await assignment.save();
  //     return savedAssignment;
  //   } catch (error) {
  //     console.error('Error creating staff assignment:', error);
  //     throw error;
  //   }
  // }

  async findAll(): Promise<StaffAssignment[]> {
    try {
      // Tự động cập nhật status cho các assignment đã hết hạn
      const now = new Date();
      await this.staffAssignmentModel.updateMany(
        {
          status: AssignmentStatus.ACTIVE,
          end_date: { $lt: now, $ne: null },
        },
        {
          $set: {
            status: 'expired',
            updated_at: now,
          },
        },
      );

      return await this.staffAssignmentModel
        .find({ status: AssignmentStatus.ACTIVE }) // Chỉ lấy những assignment còn active
        .populate(
          'staff_id',
          'full_name email role avatar position qualification',
        )
        .populate('room_id', 'room_number room_type status bed_count')
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
          end_date: { $lt: now, $ne: null },
        },
        {
          $set: {
            status: 'expired',
            updated_at: now,
          },
        },
      );

      return await this.staffAssignmentModel
        .find() // Lấy tất cả assignment (bao gồm cả expired)
        .populate(
          'staff_id',
          'full_name email role avatar position qualification',
        )
        .populate('room_id', 'room_number room_type status bed_count')
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
        .populate(
          'staff_id',
          'full_name email role avatar position qualification',
        )
        .populate('room_id', 'room_number room_type status bed_count')
        .populate('assigned_by', 'full_name email')
        .exec();

      if (!assignment) {
        throw new NotFoundException('Staff assignment not found');
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
          staff_id: new Types.ObjectId(staff_id),
          // Removed status filter to show all assignments
        })
        .populate(
          'staff_id',
          'full_name email role avatar position qualification',
        )
        .populate('room_id', 'room_number room_type status bed_count')
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

  async findByRoom(room_id: string): Promise<StaffAssignment[]> {
    try {
      if (!Types.ObjectId.isValid(room_id)) {
        throw new BadRequestException('Invalid room ID format');
      }

      return await this.staffAssignmentModel
        .find({
          room_id: new Types.ObjectId(room_id),
          status: AssignmentStatus.ACTIVE,
        })
        .populate(
          'staff_id',
          'full_name email role avatar position qualification',
        )
        .populate('room_id', 'room_number room_type status bed_count')
        .populate('assigned_by', 'full_name email')
        .exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch staff assignments for room: ${error.message}`,
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

  async findResidentsByStaff(staff_id: string): Promise<any[]> {
    try {
      if (!Types.ObjectId.isValid(staff_id)) {
        throw new BadRequestException('Invalid staff ID format');
      }

      // Get all room assignments for this staff
      const staffAssignments = await this.staffAssignmentModel
        .find({
          staff_id: new Types.ObjectId(staff_id),
          status: AssignmentStatus.ACTIVE,
        })
        .populate('room_id', 'room_number room_type status bed_count')
        .exec();

      if (staffAssignments.length === 0) {
        return [];
      }

      // Get all room IDs assigned to this staff
      const roomIds = staffAssignments.map(assignment => assignment.room_id._id);

      // Find all residents in these rooms through bed assignments
      const residents = await this.residentModel
        .find({
          is_deleted: false,
          status: { $in: ['accepted', 'active'] }, // Only active residents
        })
        .populate({
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number room_type',
            match: { _id: { $in: roomIds } }
          }
        })
        .populate('family_member_id', 'full_name email phone')
        .exec();

      // Filter residents that are actually in the assigned rooms
      const residentsInAssignedRooms = residents.filter(resident => {
        const residentWithBed = resident as any;
        return residentWithBed.bed_id && 
               residentWithBed.bed_id.room_id && 
               roomIds.some(roomId => roomId.toString() === residentWithBed.bed_id.room_id._id.toString());
      });

      // Group residents by room for better organization
      const residentsByRoom = staffAssignments.map(assignment => {
        const roomResidents = residentsInAssignedRooms.filter(resident => {
          const residentWithBed = resident as any;
          return residentWithBed.bed_id.room_id._id.toString() === assignment.room_id._id.toString();
        });

        return {
          room: assignment.room_id,
          residents: roomResidents,
          assignment: {
            assigned_date: assignment.assigned_date,
            responsibilities: assignment.responsibilities,
            notes: assignment.notes
          }
        };
      });

      return residentsByRoom;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch residents for staff: ${error.message}`,
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

      // If updating staff_id or room_id, check for conflicts
      if (
        updateStaffAssignmentDto.staff_id ||
        updateStaffAssignmentDto.room_id
      ) {
        const staff_id =
          updateStaffAssignmentDto.staff_id || assignment.staff_id.toString();
        const room_id =
          updateStaffAssignmentDto.room_id ||
          assignment.room_id.toString();

        // Enforce cumulative capacity <= 8 across all active rooms (excluding current assignment)
        const existingActiveAssignments = await this.staffAssignmentModel
          .find({
            staff_id: new Types.ObjectId(staff_id),
            status: AssignmentStatus.ACTIVE,
            _id: { $ne: new Types.ObjectId(id) },
          })
          .populate('room_id', 'room_type bed_count')
          .exec();

        const getCapacityForRoomType = (roomType?: string, fallback?: number): number => {
          switch ((roomType || '').toLowerCase()) {
            case '2_bed':
            case '2-bed':
              return 2;
            case '3_bed':
            case '3-bed':
              return 3;
            case '4_5_bed':
            case '4-5_bed':
            case '4-5-bed':
              return 5;
            case '6_8_bed':
            case '6-8_bed':
            case '6-8-bed':
              return 8;
            default:
              return typeof fallback === 'number' ? fallback : 0;
          }
        };

        const currentCapacity = existingActiveAssignments.reduce((sum, a: any) => {
          const rt = a?.room_id?.room_type;
          const cap = getCapacityForRoomType(rt, (a?.room_id as any)?.bed_count);
          return sum + (Number.isFinite(cap) ? cap : 0);
        }, 0);

        // Determine capacity for new/updated room
        const targetRoom = await this.roomModel.findById(room_id).exec();
        if (!targetRoom) {
          throw new NotFoundException('Không tìm thấy thông tin phòng');
        }
        const targetCapacity = getCapacityForRoomType((targetRoom as any)?.room_type, (targetRoom as any)?.bed_count);
        if (currentCapacity + targetCapacity > 8) {
          throw new BadRequestException(
            `Vượt quá giới hạn chăm sóc tối đa 8 người cho một nhân viên (hiện tại: ${currentCapacity}, phòng mới: ${targetCapacity}).`,
          );
        }

        const existingAssignment = await this.staffAssignmentModel.findOne({
          staff_id: new Types.ObjectId(staff_id),
          room_id: new Types.ObjectId(room_id),
          _id: { $ne: new Types.ObjectId(id) },
          status: AssignmentStatus.ACTIVE,
        });

        if (existingAssignment) {
          throw new ConflictException(
            'Staff is already assigned to this room',
          );
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
            room_id: updateStaffAssignmentDto.room_id
              ? new Types.ObjectId(updateStaffAssignmentDto.room_id)
              : undefined,
            end_date: updateStaffAssignmentDto.end_date
              ? new Date(updateStaffAssignmentDto.end_date)
              : undefined,
            updated_at: new Date(),
          },
          { new: true },
        )
        .populate('staff_id', 'full_name email role avatar')
        .populate('room_id', 'room_number room_type status bed_count')
        .populate('assigned_by', 'full_name email')
        .exec();

      if (!updatedAssignment) {
        throw new NotFoundException('Staff assignment not found after update');
      }

      return updatedAssignment;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update staff assignment: ${error.message}`,
      );
    }
  }

  async findStaffByResident(resident_id: string, req?: any): Promise<any[]> {
    try {
      if (!Types.ObjectId.isValid(resident_id)) {
        throw new BadRequestException('Invalid resident ID format');
      }

      // Find resident first
      const resident = await this.residentModel
        .findOne({ _id: new Types.ObjectId(resident_id), is_deleted: false })
        .exec();

      if (!resident) {
        throw new NotFoundException('Resident not found');
      }

      // Check if FAMILY user can access this resident
      if (req?.user?.role === 'FAMILY') {
        const familyMemberIdStr = typeof resident.family_member_id === 'object' && resident.family_member_id?._id
          ? resident.family_member_id._id.toString()
          : resident.family_member_id?.toString();
        
        if (familyMemberIdStr !== req.user.userId?.toString()) {
          throw new ForbiddenException('Bạn không có quyền xem thông tin staff của resident này!');
        }
      }

      // Find current bed assignment for this resident
      const bedAssignment = await this.bedAssignmentModel
        .findOne({ 
          resident_id: new Types.ObjectId(resident_id),
          unassigned_date: null // Only active assignments
        })
        .populate({
          path: 'bed_id',
          select: 'room_id',
        })
        .exec();

      if (!bedAssignment) {
        throw new NotFoundException('Resident is not assigned to any bed');
      }

      const bedWithRoom: any = bedAssignment.bed_id as any;
      const roomId = bedWithRoom?.room_id;

      if (!roomId) {
        // Resident has no bed/room assigned
        return [];
      }

      // Find active staff assignments for this room
      const assignments = await this.staffAssignmentModel
        .find({
          room_id: new Types.ObjectId(roomId),
          status: AssignmentStatus.ACTIVE,
        })
        .populate('staff_id', 'full_name email phone role avatar')
        .populate('assigned_by', 'full_name email')
        .exec();

      // Map to staff info with assignment metadata
      return assignments.map((a: any) => ({
        staff: a.staff_id,
        assignment: {
          _id: a._id,
          assigned_date: a.assigned_date,
          end_date: a.end_date,
          status: a.status,
          notes: a.notes,
        },
      }));
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(error?.message || 'Failed to find staff by resident');
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
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete staff assignment: ${error.message}`,
      );
    }
  }
}
