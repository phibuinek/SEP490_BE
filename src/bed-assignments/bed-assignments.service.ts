import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BedAssignment,
  BedAssignmentDocument,
} from './schemas/bed-assignment.schema';
import { BedsService } from '../beds/beds.service';
import { RoomsService } from '../rooms/rooms.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class BedAssignmentsService {
  constructor(
    @InjectModel(BedAssignment.name)
    private model: Model<BedAssignmentDocument>,
    private bedsService: BedsService,
    private roomsService: RoomsService,
  ) {}

  async create(dto: any) {
    // Check if resident đã có assignment active
    const activeAssignmentOfResident = await this.model.findOne({
      resident_id: dto.resident_id,
      unassigned_date: null,
    });
    if (activeAssignmentOfResident) {
      throw new BadRequestException('Resident is already assigned to a bed.');
    }
    // Check if bed đã có assignment active
    const activeAssignmentOfBed = await this.model.findOne({
      bed_id: dto.bed_id,
      unassigned_date: null,
    });
    if (activeAssignmentOfBed) {
      throw new BadRequestException('Bed is already assigned to a resident.');
    }
    const assignment = await this.model.create(dto);
    // Nếu unassigned_date là null, cập nhật bed sang occupied
    if (!assignment.unassigned_date) {
      const bed = await this.bedsService.findOne(assignment.bed_id.toString());
      await this.bedsService.update(assignment.bed_id.toString(), { status: 'occupied' });
      // Kiểm tra tất cả bed trong room
      if (bed && bed.room_id) {
        await this.updateRoomStatus(bed.room_id.toString());
      }
    }
    return assignment;
  }

  async findAll(bed_id?: string, resident_id?: string) {
    const filter: any = {};
    if (bed_id) filter.bed_id = bed_id;
    if (resident_id) filter.resident_id = resident_id;
    return this.model.find(filter).exec();
  }

  async unassign(id: string) {
    const assignment = await this.model.findByIdAndUpdate(
      id,
      { unassigned_date: new Date() },
      { new: true },
    );
    if (assignment) {
      const bed = await this.bedsService.findOne(assignment.bed_id.toString());
      await this.bedsService.update(assignment.bed_id.toString(), { status: 'available' });
      // Kiểm tra lại room
      if (bed && bed.room_id) {
        await this.updateRoomStatus(bed.room_id.toString());
      }
    }
    return assignment;
  }

  // Hàm phụ: cập nhật trạng thái room dựa trên trạng thái các bed
  private async updateRoomStatus(roomId: string) {
    // Lấy tất cả bed thuộc room
    const beds = await this.bedsService.findAll();
    const bedsInRoom = beds.filter(b => b.room_id.toString() === roomId);
    if (bedsInRoom.length === 0) return;
    const allOccupied = bedsInRoom.every(b => b.status === 'occupied');
    await this.roomsService.update(roomId, { status: allOccupied ? 'occupied' : 'available' });
  }
}
