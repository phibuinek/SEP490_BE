import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Param,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resident, ResidentDocument, ResidentStatus } from './schemas/resident.schema';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Bed, BedDocument } from '../beds/schemas/bed.schema';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RoomsService } from '../rooms/rooms.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
    private roomsService: RoomsService,
    @InjectModel('User') private userModel: Model<UserDocument>,
  ) {}

  async create(createResidentDto: CreateResidentDto): Promise<Resident> {
    // Tạo ngày hiện tại theo timezone Vietnam (GMT+7)
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // GMT+7
    
    // Khai báo residentData là any để tránh lỗi type khi thêm trường động
    const residentData: any = {
      ...createResidentDto,
      created_at: vietnamTime.toISOString(),
      updated_at: vietnamTime.toISOString(),
    };

    // Nếu không truyền status thì mặc định là 'active'
    if (!residentData.status) {
      residentData.status = ResidentStatus.ACTIVE;
    }

    // Nếu không truyền admission_date thì mặc định là ngày hiện tại (GMT+7)
    if (!residentData.admission_date) {
      residentData.admission_date = vietnamTime;
    } else if (typeof residentData.admission_date === 'string') {
      residentData.admission_date = new Date(residentData.admission_date);
    }

    // Fix avatar: nếu là array, lấy phần tử đầu tiên. Nếu là chuỗi rỗng, gán null.
    if (Array.isArray(residentData.avatar)) {
      residentData.avatar = residentData.avatar[0];
    }
    if (residentData.avatar === '') {
      residentData.avatar = null;
    }

    // Fix admission_date: nếu là array, lấy phần tử đầu tiên. Nếu là string, ép về Date. Nếu không hợp lệ, gán ngày hiện tại (GMT+7)
    if (Array.isArray(residentData.admission_date)) {
      residentData.admission_date = residentData.admission_date[0];
    }
    if (residentData.admission_date && typeof residentData.admission_date === 'string') {
      residentData.admission_date = new Date(residentData.admission_date);
    }
    if (!residentData.admission_date || isNaN(residentData.admission_date.getTime())) {
      residentData.admission_date = vietnamTime;
    }

    // Ép family_member_id về ObjectId nếu là string
    if (residentData.family_member_id && typeof residentData.family_member_id === 'string') {
      residentData.family_member_id = new Types.ObjectId(residentData.family_member_id);
    }

    // Flatten all possible array fields
    ['avatar', 'admission_date', 'date_of_birth', 'created_at', 'updated_at'].forEach(field => {
      if (Array.isArray(residentData[field])) {
        residentData[field] = residentData[field].length > 0 ? residentData[field][0] : null;
      }
    });

    // avatar: nếu là chuỗi rỗng hoặc undefined, gán null
    if (residentData.avatar === '' || typeof residentData.avatar === 'undefined') {
      residentData.avatar = null;
    }

    // admission_date: ép về Date object, nếu không hợp lệ gán ngày hiện tại
    if (residentData.admission_date && typeof residentData.admission_date === 'string') {
      const d = new Date(residentData.admission_date);
      residentData.admission_date = isNaN(d.getTime()) ? vietnamTime : d;
    }
    if (!(residentData.admission_date instanceof Date)) {
      residentData.admission_date = vietnamTime;
    }

    // family_member_id: ép về ObjectId nếu là string
    if (residentData.family_member_id && typeof residentData.family_member_id === 'string') {
      residentData.family_member_id = new Types.ObjectId(residentData.family_member_id);
    }

    // Các trường date khác: ép về Date object nếu là string, nếu không hợp lệ gán ngày hiện tại
    ['date_of_birth', 'created_at', 'updated_at'].forEach(field => {
      if (residentData[field] && typeof residentData[field] === 'string') {
        const d = new Date(residentData[field]);
        residentData[field] = isNaN(d.getTime()) ? vietnamTime : d;
      }
      if (!(residentData[field] instanceof Date)) {
        residentData[field] = vietnamTime;
      }
    });

    // Log typeof từng trường để debug
    ['family_member_id', 'date_of_birth', 'admission_date', 'created_at', 'updated_at'].forEach(field => {
      console.log(field, typeof residentData[field], residentData[field]);
    });
   // Nếu không truyền emergency_contact thì tự động lấy từ family_member
   if (!residentData.emergency_contact && residentData.family_member_id) {
     const family = await this.userModel.findById(residentData.family_member_id);
     if (family) {
       residentData.emergency_contact = {
         name: family.full_name,
         phone: family.phone,
         relationship: residentData.relationship || 'khác',
       };
     }
   }
    
    try {
      const createdResident = new this.residentModel(residentData);
      return await createdResident.save();
    } catch (error) {
      // Log chi tiết lỗi validation
      console.error('Resident create validation error:', JSON.stringify(error?.errInfo?.details, null, 2));
      throw error;
    }
  }

  async findAll(): Promise<Resident[]> {
    const residents = await this.residentModel
      .find()
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
    // Lấy dữ liệu cũ
    const oldResident = await this.residentModel.findById(id);
    if (!oldResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }

    // Chuẩn bị dữ liệu update, tự động điền các trường required nếu không truyền lên
    const updateData: any = { ...updateResidentDto };

    // Các trường required cần giữ nguyên nếu không truyền lên (admission_date, created_at)
    if (typeof updateData.admission_date === 'undefined') {
      updateData.admission_date = oldResident.admission_date;
    } else if (updateData.admission_date) {
      updateData.admission_date = new Date(updateData.admission_date);
    }
    if (typeof updateData.created_at === 'undefined') {
      updateData.created_at = oldResident.created_at;
    } else if (updateData.created_at) {
      updateData.created_at = new Date(updateData.created_at);
    }
    // updated_at luôn là giờ Việt Nam (GMT+7)
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    updateData.updated_at = vietnamTime;

    // discharge_date: nếu truyền lên thì ép kiểu, nếu không thì giữ nguyên
    if (typeof updateData.discharge_date === 'undefined') {
      updateData.discharge_date = oldResident.discharge_date;
    } else if (updateData.discharge_date) {
      updateData.discharge_date = new Date(updateData.discharge_date);
    }

    // family_member_id: nếu truyền lên thì ép kiểu ObjectId, nếu không thì giữ nguyên
    if (typeof updateData.family_member_id === 'undefined') {
      updateData.family_member_id = oldResident.family_member_id;
    } else if (updateData.family_member_id) {
      updateData.family_member_id = new Types.ObjectId(updateData.family_member_id);
    }

    // Nếu status được cập nhật thành 'discharged' hoặc 'deceased', tự động cập nhật discharge_date
    if (
      (updateData.status === 'discharged' || updateData.status === 'deceased') &&
      (oldResident.status !== updateData.status)
    ) {
      updateData.discharge_date = vietnamTime;
    }

    // Nếu không truyền emergency_contact thì chỉ giữ nguyên emergency_contact cũ trong DB
    if (typeof updateData.emergency_contact === 'undefined' || updateData.emergency_contact === null) {
      updateData.emergency_contact = oldResident.emergency_contact;
    }

    // Ép emergency_contact về plain object nếu là instance class
    if (updateData.emergency_contact && typeof updateData.emergency_contact === 'object' && updateData.emergency_contact.name) {
      updateData.emergency_contact = {
        name: updateData.emergency_contact.name,
        phone: updateData.emergency_contact.phone,
        relationship: updateData.emergency_contact.relationship,
      };
    }

    // Các trường required khác nếu không truyền lên thì giữ nguyên và clone đúng kiểu
    const requiredFields = [
      'full_name',
      'date_of_birth',
      'gender',
      'relationship',
      'medical_history',
      'current_medications',
      'allergies',
      'emergency_contact',
      'status',
      'admission_date',
      'created_at',
      'updated_at',
    ];
    for (const field of requiredFields) {
      if (typeof updateData[field] === 'undefined' || updateData[field] === null) {
        updateData[field] = oldResident[field];
      }
      // Nếu là trường date, ép lại thành Date nếu là string, nếu không hợp lệ thì lấy từ DB hoặc new Date()
      if (
        ['date_of_birth', 'admission_date', 'created_at', 'updated_at', 'discharge_date'].includes(field)
      ) {
        if (typeof updateData[field] === 'string') {
          const d = new Date(updateData[field]);
          updateData[field] = isNaN(d.getTime()) ? oldResident[field] || new Date() : d;
        }
        if (!(updateData[field] instanceof Date)) {
          updateData[field] = oldResident[field] || new Date();
        }
      }
    }

    // Ép family_member_id về ObjectId nếu cần
    if (updateData.family_member_id && typeof updateData.family_member_id !== 'object') {
      updateData.family_member_id = new Types.ObjectId(updateData.family_member_id);
    }
    // Ép các trường date về Date instance nếu cần
    [ 'admission_date', 'created_at', 'updated_at', 'date_of_birth', 'discharge_date' ].forEach(field => {
      if (updateData[field] && !(updateData[field] instanceof Date)) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    // Log lại dữ liệu updateData để debug (JSON)
    console.log('Resident updateData (JSON):', JSON.stringify(updateData, null, 2));

    // Tiến hành update, log lỗi chi tiết nếu có
    try {
      const updatedResident = await this.residentModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedResident) {
        throw new NotFoundException(`Resident with ID ${id} not found`);
      }
      return updatedResident;
    } catch (error) {
      // Log chi tiết lỗi validation
      console.error('Resident update validation error:', error?.errInfo?.details?.schemaRulesNotSatisfied || error);
      throw error;
    }
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
