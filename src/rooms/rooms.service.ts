import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';
import { Bed, BedDocument } from '../beds/schemas/bed.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(BedAssignment.name) private bedAssignmentModel: Model<BedAssignmentDocument>,
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    return this.roomModel.create(createRoomDto);
  }

  async findAll(): Promise<any[]> {
    const rooms = await this.roomModel.find().lean();
    const result: any[] = [];

    for (const room of rooms) {
      // Lấy tất cả bed thuộc room này
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
      // Tính status động
      let status = 'available';
      if (occupiedBeds === room.bed_count) {
        status = 'occupied';
      }
      // Giữ các trạng thái đặc biệt nếu có
      if (room.status === 'maintenance' || room.status === 'reserved') {
        status = room.status;
      }
      result.push({ ...room, status });
    }
    return result;
  }

  async findOne(id: string): Promise<Room | null> {
    return this.roomModel.findById(id).exec();
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room | null> {
    return this.roomModel.findByIdAndUpdate(id, updateRoomDto, { new: true }).exec();
  }

  async remove(id: string): Promise<any> {
    return this.roomModel.findByIdAndDelete(id).exec();
  }
} 