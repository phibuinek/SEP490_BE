import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import {
  BedAssignment,
  BedAssignmentDocument,
} from '../bed-assignments/schemas/bed-assignment.schema';
import { Bed, BedDocument } from '../beds/schemas/bed.schema';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(BedAssignment.name)
    private bedAssignmentModel: Model<BedAssignmentDocument>,
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    // Kiểm tra main_care_plan_id có hợp lệ không
    if (!Types.ObjectId.isValid(createRoomDto.main_care_plan_id)) {
      throw new BadRequestException('main_care_plan_id không hợp lệ');
    }
    // Convert main_care_plan_id sang ObjectId và set status mặc định là occupied
    const data = {
      ...createRoomDto,
      main_care_plan_id: new Types.ObjectId(createRoomDto.main_care_plan_id),
      status: 'occupied', // Mặc định là occupied khi tạo phòng mới
    };
    return this.roomModel.create(data);
  }

  async findAll(): Promise<any[]> {
    const rooms = await this.roomModel.find().lean();
    const result: any[] = [];

    for (const room of rooms) {
      // Lấy thông tin giường để hiển thị
      const beds = await this.bedModel.find({ room_id: room._id }).lean();
      let occupiedBeds = 0;
      for (const bed of beds) {
        // Kiểm tra bed này có assignment active không
        const assignment = await this.bedAssignmentModel.findOne({
          bed_id: bed._id,
          unassigned_date: null,
        });
        if (assignment) occupiedBeds++;
      }
      
      // Sử dụng status từ database, không tính động nữa
      result.push({ 
        ...room, 
        status: room.status,
        bed_info: {
          total_beds: room.bed_count,
          current_beds: beds.length,
          occupied_beds: occupiedBeds,
          available_beds: beds.length - occupiedBeds
        }
      });
    }
    return result;
  }

  async findOne(id: string): Promise<Room | null> {
    return this.roomModel.findById(id).exec();
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room | null> {
    return this.roomModel
      .findByIdAndUpdate(id, updateRoomDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.roomModel.findByIdAndDelete(id).exec();
  }

  /**
   * Kiểm tra và cập nhật trạng thái phòng khi thêm giường
   * Chuyển từ occupied sang available khi đủ số giường
   */
  async checkAndUpdateRoomStatus(roomId: string): Promise<void> {
    try {
      const room = await this.roomModel.findById(roomId);
      if (!room) {
        console.log(`[ROOMS] Room ${roomId} not found`);
        return;
      }

      // Chỉ kiểm tra nếu phòng đang ở trạng thái occupied
      if (room.status !== 'occupied') {
        console.log(`[ROOMS] Room ${roomId} is not in occupied status (current: ${room.status})`);
        return;
      }

      // Đếm số giường trong phòng
      const bedCount = await this.bedModel.countDocuments({ room_id: roomId });
      
      console.log(`[ROOMS] Room ${roomId} has ${bedCount}/${room.bed_count} beds`);

      // Nếu đủ số giường, chuyển sang available
      if (bedCount >= room.bed_count) {
        await this.roomModel.findByIdAndUpdate(roomId, { status: 'available' });
        console.log(`[ROOMS] Room ${roomId} status updated from occupied to available`);
      }
    } catch (error) {
      console.error(`[ROOMS] Error checking room status for ${roomId}:`, error);
    }
  }

  /**
   * Kiểm tra và reset trạng thái phòng về occupied khi xóa giường
   */
  async checkAndResetRoomStatus(roomId: string): Promise<void> {
    try {
      const room = await this.roomModel.findById(roomId);
      if (!room) {
        console.log(`[ROOMS] Room ${roomId} not found`);
        return;
      }

      // Chỉ kiểm tra nếu phòng đang ở trạng thái available
      if (room.status !== 'available') {
        console.log(`[ROOMS] Room ${roomId} is not in available status (current: ${room.status})`);
        return;
      }

      // Đếm số giường trong phòng
      const bedCount = await this.bedModel.countDocuments({ room_id: roomId });
      
      console.log(`[ROOMS] Room ${roomId} has ${bedCount}/${room.bed_count} beds after deletion`);

      // Nếu không đủ số giường, chuyển về occupied
      if (bedCount < room.bed_count) {
        await this.roomModel.findByIdAndUpdate(roomId, { status: 'occupied' });
        console.log(`[ROOMS] Room ${roomId} status reset from available to occupied`);
      }
    } catch (error) {
      console.error(`[ROOMS] Error checking room status for ${roomId}:`, error);
    }
  }

  /**
   * Kiểm tra và cập nhật trạng thái tất cả phòng (để chạy một lần khi deploy)
   */
  async updateAllRoomStatuses(): Promise<void> {
    try {
      console.log('[ROOMS] Starting bulk room status update...');
      const rooms = await this.roomModel.find().lean();
      
      for (const room of rooms) {
        const bedCount = await this.bedModel.countDocuments({ room_id: room._id });
        
        let newStatus = room.status;
        
        // Nếu phòng đang available nhưng không đủ giường -> chuyển về occupied
        if (room.status === 'available' && bedCount < room.bed_count) {
          newStatus = 'occupied';
        }
        // Nếu phòng đang occupied nhưng đủ giường -> chuyển sang available
        else if (room.status === 'occupied' && bedCount >= room.bed_count) {
          newStatus = 'available';
        }
        // Giữ nguyên các trạng thái đặc biệt (maintenance, reserved)
        else if (room.status === 'maintenance' || room.status === 'reserved') {
          newStatus = room.status;
        }
        
        if (newStatus !== room.status) {
          await this.roomModel.findByIdAndUpdate(room._id, { status: newStatus });
          console.log(`[ROOMS] Room ${room.room_number} status updated: ${room.status} -> ${newStatus} (${bedCount}/${room.bed_count} beds)`);
        }
      }
      
      console.log('[ROOMS] Bulk room status update completed');
    } catch (error) {
      console.error('[ROOMS] Error in bulk room status update:', error);
    }
  }

  async filterRooms(room_type?: string, status?: string, main_care_plan_id?: string, gender?: string): Promise<any[]> {
    const filter: any = {};
    if (room_type) filter.room_type = room_type;
    if (main_care_plan_id && Types.ObjectId.isValid(main_care_plan_id)) filter.main_care_plan_id = new Types.ObjectId(main_care_plan_id);
    if (gender) filter.gender = gender;
    if (status) filter.status = status; // Sử dụng status từ database
    
    const rooms = await this.roomModel.find(filter).lean();
    const result: any[] = [];
    
    for (const room of rooms) {
      const beds = await this.bedModel.find({ room_id: room._id }).lean();
      let occupiedBeds = 0;
      for (const bed of beds) {
        const assignment = await this.bedAssignmentModel.findOne({ bed_id: bed._id, unassigned_date: null });
        if (assignment) occupiedBeds++;
      }
      
      result.push({ 
        ...room, 
        status: room.status, // Sử dụng status từ database
        bed_info: {
          total_beds: room.bed_count,
          current_beds: beds.length,
          occupied_beds: occupiedBeds,
          available_beds: beds.length - occupiedBeds
        }
      });
    }
    return result;
  }
}
