import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoomType, RoomTypeDocument } from './schemas/room-type.schema';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectModel(RoomType.name)
    private roomTypeModel: Model<RoomTypeDocument>,
  ) {}

  async create(createDto: CreateRoomTypeDto): Promise<RoomType> {
    const created = new this.roomTypeModel(createDto);
    return created.save();
  }

  async findAll(): Promise<RoomType[]> {
    return this.roomTypeModel.find().exec();
  }

  async findOne(id: string): Promise<RoomType> {
    const roomType = await this.roomTypeModel.findById(id).exec();
    if (!roomType) throw new NotFoundException('Room type not found');
    return roomType;
  }

  async update(id: string, updateDto: UpdateRoomTypeDto): Promise<RoomType> {
    const updated = await this.roomTypeModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Room type not found');
    return updated;
  }

  async remove(id: string): Promise<any> {
    const deleted = await this.roomTypeModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Room type not found');
    return { deleted: true };
  }
} 