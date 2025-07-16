import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bed, BedDocument } from './schemas/bed.schema';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';

@Injectable()
export class BedsService {
  constructor(@InjectModel(Bed.name) private bedModel: Model<BedDocument>) {}

  async create(createBedDto: CreateBedDto): Promise<Bed> {
    return this.bedModel.create(createBedDto);
  }

  async findAll(): Promise<Bed[]> {
    return this.bedModel.find().exec();
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
    return this.bedModel.findByIdAndDelete(id).exec();
  }
}
