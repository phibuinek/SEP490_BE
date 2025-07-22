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
    // Convert main_care_plan_id sang ObjectId
    const data = {
      ...createRoomDto,
      main_care_plan_id: new Types.ObjectId(createRoomDto.main_care_plan_id),
    };
    return this.roomModel.create(data);
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
    return this.roomModel
      .findByIdAndUpdate(id, updateRoomDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.roomModel.findByIdAndDelete(id).exec();
  }

  async filterRooms(room_type?: string, status?: string, main_care_plan_id?: string, gender?: string): Promise<any[]> {
    const filter: any = {};
    if (room_type) filter.room_type = room_type;
    if (main_care_plan_id && Types.ObjectId.isValid(main_care_plan_id)) filter.main_care_plan_id = new Types.ObjectId(main_care_plan_id);
    if (gender) filter.gender = gender;
    if (status && status !== 'occupied' && status !== 'available') filter.status = status;
    // occupied/available sẽ tính động
    const rooms = await this.roomModel.find(filter).lean();
    const result: any[] = [];
    for (const room of rooms) {
      const beds = await this.bedModel.find({ room_id: room._id }).lean();
      let occupiedBeds = 0;
      for (const bed of beds) {
        const assignment = await this.bedAssignmentModel.findOne({ bed_id: bed._id, unassigned_date: null });
        if (assignment) occupiedBeds++;
      }
      let dynamicStatus = 'available';
      if (occupiedBeds === room.bed_count) dynamicStatus = 'occupied';
      if (room.status === 'maintenance' || room.status === 'reserved') dynamicStatus = room.status;
      if (!status || status === dynamicStatus) {
        result.push({ ...room, status: dynamicStatus });
      }
    }
    return result;
  }
}
