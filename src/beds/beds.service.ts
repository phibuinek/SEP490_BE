import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bed, BedDocument } from './schemas/bed.schema';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';

@Injectable()
export class BedsService {
  constructor(@InjectModel(Bed.name) private bedModel: Model<BedDocument>) {}

  async create(createDto: CreateBedDto): Promise<Bed> {
    const createdBed = new this.bedModel(createDto);
    return createdBed.save();
  }

  async findAll(): Promise<Bed[]> {
    return this.bedModel.find().exec();
  }

  async findOne(id: string): Promise<Bed> {
    const bed = await this.bedModel.findById(id).exec();
    if (!bed) {
      throw new NotFoundException(`Bed with ID "${id}" not found`);
    }
    return bed;
  }

  async update(id: string, updateDto: UpdateBedDto): Promise<Bed> {
    const existingBed = await this.bedModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!existingBed) {
      throw new NotFoundException(`Bed with ID "${id}" not found`);
    }
    return existingBed;
  }

  async remove(id: string): Promise<any> {
    const result = await this.bedModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Bed with ID "${id}" not found`);
    }
    return { deleted: true };
  }
} 