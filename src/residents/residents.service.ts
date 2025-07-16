import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Param,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resident, ResidentDocument } from './schemas/resident.schema';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Bed, BedDocument } from '../beds/schemas/bed.schema';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
    private roomsService: RoomsService,
  ) {}

  async create(createResidentDto: CreateResidentDto): Promise<Resident> {
    const createdResident = new this.residentModel(createResidentDto);
    return createdResident.save();
  }

  async findAll(careLevel?: string): Promise<Resident[]> {
    const filter: any = {};
    if (careLevel) {
      if (careLevel === 'unregistered') {
        filter.careLevel = { $exists: false };
      } else {
        filter.careLevel = careLevel;
      }
    }
    const residents = await this.residentModel
      .find(filter)
      .populate('family_member_id', 'full_name email')
      .exec();
    return residents;
  }

  async findOne(id: string): Promise<Resident> {
    const resident = await this.residentModel.findById(id);
    if (!resident)
      throw new NotFoundException(`Resident with ID ${id} not found`);
    return resident;
  }

  async findAllByFamilyMemberId(familyMemberId: string): Promise<Resident[]> {
    // Đảm bảo so sánh đúng kiểu ObjectId với trường family_member_id
    return this.residentModel
      .find({ family_member_id: new Types.ObjectId(familyMemberId) })
      .exec();
  }

  async update(
    id: string,
    updateResidentDto: UpdateResidentDto,
  ): Promise<Resident> {
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

    const deletedResident = await this.residentModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return { deleted: true, _id: id };
  }

  async assignBed(resident_id: string, bed_id: string): Promise<Bed> {
    const resident = await this.residentModel.findById(resident_id);
    if (!resident) throw new NotFoundException('Resident not found');

    const bed = await this.bedModel.findById(bed_id);
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.status === 'occupied') {
      throw new BadRequestException(
        `Bed ${bed.bed_number} is already occupied.`,
      );
    }

    // Unassign the bed from its current resident if any, just in case
    // if(bed.resident_id) {
    //     await this.unassignBed(bed_id)
    // }

    // Unassign the resident from their current bed if any
    await this.unassignBedFromResident(resident_id);

    // Assign new bed
    bed.status = 'occupied';
    await bed.save();

    // Sau khi gán bed, kiểm tra tất cả bed trong room
    const room_id = bed.room_id;
    const allBeds = await this.bedModel.find({ room_id: room_id });
    const allOccupied = allBeds.every(b => b.status === 'occupied');
    // Cập nhật status room
    await this.roomsService.update(room_id.toString(), { status: allOccupied ? 'occupied' : 'available' });

    return bed;
  }

  async unassignBed(bed_id: string): Promise<Bed> {
    const bed = await this.bedModel.findById(bed_id);
    if (!bed) throw new NotFoundException('Bed not found');

    bed.status = 'available';
    // bed.resident_id = null;
    return bed.save();
  }

  private async unassignBedFromResident(resident_id: string): Promise<void> {
    // Không còn resident_id trong bed, bỏ qua toàn bộ logic này
    // const currentBed = await this.bedModel.findOne({ resident_id: new Types.ObjectId(resident_id) });
    // if (currentBed) {
    //   currentBed.status = 'available';
    //   currentBed.resident_id = null;
    //   await currentBed.save();
    // }
  }
}
