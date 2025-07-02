import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Resident, ResidentDocument } from './schemas/resident.schema';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(createResidentDto: CreateResidentDto): Promise<Resident> {
    const { family_member_id } = createResidentDto;

    // 1. Check if the family member exists and has the 'family' role
    const familyMember = await this.usersService.findOne(family_member_id);
    if (!familyMember || familyMember.role !== UserRole.FAMILY) {
      throw new BadRequestException('Invalid family member ID or user is not a family member.');
    }

    // 2. Create and save the new resident
    const createdResident = new this.residentModel(createResidentDto);
    await createdResident.save();

    // 3. Add the new resident's ID to the family member's `residents` array
    const newResidentId = (createdResident._id as any).toString();

    // Safely handle optional residents array and convert ObjectIds to strings
    const currentResidentIds = familyMember.residents?.map(id => id.toString()) || [];

    if (!currentResidentIds.includes(newResidentId)) {
      const updatedResidentIds = [...currentResidentIds, newResidentId];
      // The DTO expects an array of strings, which we are now providing
      await this.usersService.update(family_member_id, { residents: updatedResidentIds });
    }

    return createdResident;
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
    const updatedResident = await this.residentModel.findByIdAndUpdate(id, updateResidentDto, { new: true });
    if (!updatedResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return updatedResident;
  }

  async remove(id: string): Promise<{ deleted: boolean, id: string }> {
    const result = await this.residentModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return { deleted: true, id };
  }
}
