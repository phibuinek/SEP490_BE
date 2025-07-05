import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resident, ResidentDocument } from './schemas/resident.schema';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Bed, BedDocument, BedStatus } from '../beds/schemas/bed.schema';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
  ) {}

  async create(createResidentDto: CreateResidentDto): Promise<Resident> {
    const createdResident = new this.residentModel(createResidentDto);
    return createdResident.save();
  }

  async findAll(): Promise<Resident[]> {
    return this.residentModel.find().populate('familyMemberId', 'fullName email').exec();
  }

  async findOne(id: string): Promise<Resident> {
    const resident = await this.residentModel.findById(id).populate('familyMemberId', 'fullName email').exec();
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return resident;
  }

  async findAllByFamilyMemberId(familyMemberId: string): Promise<Resident[]> {
    return this.residentModel.find({ family_member_id: familyMemberId }).exec();
  }

  async update(id: string, updateResidentDto: UpdateResidentDto): Promise<Resident> {
    const updatedResident = await this.residentModel
      .findByIdAndUpdate(id, updateResidentDto, { new: true })
      .exec();
    if (!updatedResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return updatedResident;
  }

  async remove(id: string): Promise<any> {
    // First, unassign bed if any
    await this.unassignBedFromResident(id);

    const deletedResident = await this.residentModel.findByIdAndDelete(id).exec();
    if (!deletedResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return { deleted: true, _id: id };
  }

  async assignBed(residentId: string, bedId: string): Promise<Bed> {
    const resident = await this.residentModel.findById(residentId);
    if (!resident) throw new NotFoundException('Resident not found');

    const bed = await this.bedModel.findById(bedId);
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.status === BedStatus.OCCUPIED) {
      throw new BadRequestException(`Bed ${bed.bedNumber} is already occupied.`);
    }

    // Unassign the bed from its current resident if any, just in case
    if(bed.residentId) {
        await this.unassignBed(bedId)
    }
    
    // Unassign the resident from their current bed if any
    await this.unassignBedFromResident(residentId);

    // Assign new bed
    bed.status = BedStatus.OCCUPIED;
    bed.residentId = resident._id as Types.ObjectId;
    return bed.save();
  }

  async unassignBed(bedId: string): Promise<Bed> {
    const bed = await this.bedModel.findById(bedId);
    if (!bed) throw new NotFoundException('Bed not found');

    bed.status = BedStatus.AVAILABLE;
    bed.residentId = null;
    return bed.save();
  }

  private async unassignBedFromResident(residentId: string): Promise<void> {
    const currentBed = await this.bedModel.findOne({ residentId: new Types.ObjectId(residentId) });
    if (currentBed) {
      currentBed.status = BedStatus.AVAILABLE;
      currentBed.residentId = null;
      await currentBed.save();
    }
  }
}
