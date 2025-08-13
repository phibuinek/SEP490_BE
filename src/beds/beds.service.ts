import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bed, BedDocument } from './schemas/bed.schema';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';
import { BadRequestException } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class BedsService {
  constructor(
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
    @InjectModel(BedAssignment.name) private bedAssignmentModel: Model<BedAssignmentDocument>,
    private roomsService: RoomsService,
  ) {}

  async create(createBedDto: CreateBedDto): Promise<Bed> {
    if (!Types.ObjectId.isValid(createBedDto.room_id)) {
      throw new BadRequestException('room_id không hợp lệ');
    }
    const data = {
      ...createBedDto,
      room_id: new Types.ObjectId(createBedDto.room_id),
    };
    
    // Tạo giường mới
    const bed = await this.bedModel.create(data);
    
    // Kiểm tra và cập nhật trạng thái phòng
    await this.roomsService.checkAndUpdateRoomStatus(createBedDto.room_id);
    
    return bed;
  }

  async findAll(): Promise<any[]> {
    return this.findAllByStatus();
  }

  async findAllByStatus(status?: string): Promise<any[]> {
    // Populate thông tin room để có đầy đủ dữ liệu
    const beds = await this.bedModel.find().populate({
      path: 'room_id',
      select: 'room_number room_type floor gender main_care_plan_id bed_count'
    }).lean();
    
    const result: any[] = [];
    for (const bed of beds) {
      // Tìm bed assignment đang active (chưa có unassigned_date)
      const assignment = await this.bedAssignmentModel.findOne({ 
        bed_id: bed._id, 
        unassigned_date: null 
      })
      .populate({
        path: 'resident_id',
        select: 'full_name gender'
      })
      .lean();
      
      // Xác định trạng thái thực tế của giường
      let dynamicStatus = 'available'; // Default là available
      if (assignment) {
        dynamicStatus = 'occupied'; // Có assignment thì là occupied
      }
      
      // Nếu có filter status thì chỉ trả về bed phù hợp
      if (!status || dynamicStatus === status) {
        result.push({ 
          ...bed, 
          status: dynamicStatus,
          is_assigned: !!assignment,
          assignment_id: assignment?._id || null,
          resident_id: assignment?.resident_id || null,
          assigned_date: assignment?.assigned_date || null,
          // Thêm thông tin room đầy đủ
          room_info: bed.room_id
        });
      }
    }
    return result;
  }

  async findOne(id: string): Promise<Bed | null> {
    return this.bedModel.findById(id).exec();
  }

  async update(id: string, updateBedDto: UpdateBedDto): Promise<Bed | null> {
    return this.bedModel
      .findByIdAndUpdate(id, updateBedDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    // Lấy thông tin giường trước khi xóa để biết room_id
    const bed = await this.bedModel.findById(id);
    if (!bed) {
      throw new BadRequestException('Bed not found');
    }
    
    const roomId = bed.room_id.toString();
    
    // Xóa giường
    const result = await this.bedModel.findByIdAndDelete(id).exec();
    
    // Kiểm tra và reset trạng thái phòng
    await this.roomsService.checkAndResetRoomStatus(roomId);
    
    return result;
  }

  async findByRoomIdWithStatus(room_id: string, status?: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(room_id)) return [];
    const beds = await this.bedModel.find({ room_id: new Types.ObjectId(room_id) }).lean();
    const result: any[] = [];
    for (const bed of beds) {
      const assignment = await this.bedAssignmentModel.findOne({ bed_id: bed._id, unassigned_date: null });
      let dynamicStatus = bed.status;
      if (assignment) dynamicStatus = 'occupied';
      // Nếu có filter status thì chỉ trả về bed phù hợp
      if (!status || dynamicStatus === status) {
        result.push({ ...bed, status: dynamicStatus });
      }
    }
    return result;
  }
}
