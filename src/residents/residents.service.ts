import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resident, ResidentDocument } from './schemas/resident.schema';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { UsersService } from '../users/users.service';
import { Bed, BedDocument } from '../beds/schemas/bed.schema';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
    private readonly usersService: UsersService,
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
  ) {}

  async create(createResidentDto: CreateResidentDto): Promise<Resident> {
    const createdResident = new this.residentModel(createResidentDto);
    return createdResident.save();
  }

  async addFamilyMember(residentId: string, familyMemberId: string): Promise<Resident> {
    const resident = await this.residentModel.findById(residentId) as ResidentDocument;
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${residentId} not found`);
    }
    await this.usersService.addResidentToFamily(familyMemberId, residentId);
    
    resident.familyIds.push(familyMemberId as any);
    return resident.save();
  }

  async removeFamilyMember(residentId: string, familyMemberId: string): Promise<Resident> {
    const resident = await this.residentModel.findById(residentId) as ResidentDocument;
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${residentId} not found`);
    }
    await this.usersService.removeResidentFromFamily(familyMemberId, residentId);

    const familyIndex = resident.familyIds.findIndex(id => id.toString() === familyMemberId);
    if (familyIndex > -1) {
      resident.familyIds.splice(familyIndex, 1);
    }
    return resident.save();
  }

  async findAll(): Promise<Resident[]> {
    return this.residentModel.find().exec();
  }

  async findOne(id: string): Promise<Resident> {
    const resident = await this.residentModel.findById(id).exec();
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return resident;
  }

  async update(id: string, updateResidentDto: UpdateResidentDto): Promise<Resident> {
    const updatedResident = await this.residentModel.findByIdAndUpdate(id, updateResidentDto, { new: true }).exec();
    if (!updatedResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return updatedResident;
  }

  async remove(id: string): Promise<Resident> {
    const deletedResident = await this.residentModel.findByIdAndDelete(id).exec();
    if (!deletedResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    // Optional: Also remove the resident from the family member's array
    for (const familyId of deletedResident.familyIds) {
      await this.usersService.removeResidentFromFamily(familyId.toString(), deletedResident._id);
    }
    return deletedResident;
  }

  async assignBed(residentId: string, bedId: string): Promise<Resident> {
    const resident = await this.residentModel.findById(residentId) as ResidentDocument;
    if (!resident) throw new NotFoundException('Resident not found');

    const bed = await this.bedModel.findById(bedId);
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.isOccupied) throw new NotFoundException('Bed already occupied');

    // If resident already has a bed, free previous one
    if (resident.bedId as any) {
      await this.bedModel.findByIdAndUpdate(resident.bedId as any, {
        isOccupied: false,
        residentId: null,
      });
    }

    bed.isOccupied = true;
    bed.residentId = resident._id as Types.ObjectId;
    await bed.save();

    resident.bedId = bed._id as any;
    return resident.save();
  }
}
