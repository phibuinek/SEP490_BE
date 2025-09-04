import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Param,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Resident,
  ResidentDocument,
  ResidentStatus,
} from './schemas/resident.schema';
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
    try {
      console.log(
        '[RESIDENT][CREATE] Input DTO:',
        JSON.stringify(createResidentDto, null, 2),
      );

      // Tạo ngày hiện tại theo timezone Vietnam (GMT+7)
      const now = new Date();
      const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // GMT+7

      // Khai báo residentData là any để tránh lỗi type khi thêm trường động
      const residentData: any = {
        ...createResidentDto,
        created_at: vietnamTime.toISOString(),
        updated_at: vietnamTime.toISOString(),
      };

      console.log(
        '[RESIDENT][CREATE] Initial residentData:',
        JSON.stringify(residentData, null, 2),
      );

      // // Nếu không truyền status thì mặc định là 'active'
      // if (!residentData.status) {
      //   residentData.status = ResidentStatus.ACTIVE;
      // }
      // Mặc định status = pending (chờ duyệt)
      residentData.status = ResidentStatus.PENDING;

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
      if (
        residentData.admission_date &&
        typeof residentData.admission_date === 'string'
      ) {
        residentData.admission_date = new Date(residentData.admission_date);
      }
      if (
        !residentData.admission_date ||
        isNaN(residentData.admission_date.getTime())
      ) {
        residentData.admission_date = vietnamTime;
      }

      // Ép family_member_id về ObjectId nếu là string
      if (
        residentData.family_member_id &&
        typeof residentData.family_member_id === 'string'
      ) {
        try {
          residentData.family_member_id = new Types.ObjectId(
            residentData.family_member_id,
          );
          console.log(
            '[RESIDENT][CREATE] Converted family_member_id to ObjectId:',
            residentData.family_member_id,
          );
        } catch (error) {
          console.error(
            '[RESIDENT][CREATE] Invalid family_member_id format:',
            residentData.family_member_id,
          );
          throw new BadRequestException('Invalid family_member_id format');
        }
      }

      // Flatten all possible array fields
      [
        'avatar',
        'admission_date',
        'date_of_birth',
        'created_at',
        'updated_at',
      ].forEach((field) => {
        if (Array.isArray(residentData[field])) {
          residentData[field] =
            residentData[field].length > 0 ? residentData[field][0] : null;
        }
      });

      // avatar: nếu là chuỗi rỗng hoặc undefined, gán null
      if (
        residentData.avatar === '' ||
        typeof residentData.avatar === 'undefined'
      ) {
        residentData.avatar = null;
      }

      // admission_date: ép về Date object, nếu không hợp lệ gán ngày hiện tại
      if (
        residentData.admission_date &&
        typeof residentData.admission_date === 'string'
      ) {
        const d = new Date(residentData.admission_date);
        residentData.admission_date = isNaN(d.getTime()) ? vietnamTime : d;
      }
      if (!(residentData.admission_date instanceof Date)) {
        residentData.admission_date = vietnamTime;
      }

      // family_member_id: ép về ObjectId nếu là string
      if (
        residentData.family_member_id &&
        typeof residentData.family_member_id === 'string'
      ) {
        try {
          residentData.family_member_id = new Types.ObjectId(
            residentData.family_member_id,
          );
        } catch (error) {
          console.error(
            '[RESIDENT][CREATE] Invalid family_member_id format:',
            residentData.family_member_id,
          );
          throw new BadRequestException('Invalid family_member_id format');
        }
      }

      // Xử lý medical_history: nếu rỗng hoặc undefined thì gán null
      if (
        !residentData.medical_history ||
        residentData.medical_history.trim() === ''
      ) {
        residentData.medical_history = null;
        console.log('[RESIDENT][CREATE] Set medical_history to null');
      }

      // Xử lý current_medications: nếu không có hoặc rỗng thì gán mảng rỗng
      if (
        !residentData.current_medications ||
        !Array.isArray(residentData.current_medications)
      ) {
        residentData.current_medications = [];
        console.log(
          '[RESIDENT][CREATE] Set current_medications to empty array',
        );
      }

      // Xử lý allergies: nếu không có hoặc rỗng thì gán mảng rỗng
      if (!residentData.allergies || !Array.isArray(residentData.allergies)) {
        residentData.allergies = [];
        console.log('[RESIDENT][CREATE] Set allergies to empty array');
      }

      console.log(
        '[RESIDENT][CREATE] Final residentData before save:',
        JSON.stringify(residentData, null, 2),
      );

      // Kiểm tra xem family_member_id có tồn tại trong DB không
      if (residentData.family_member_id) {
        const familyMember = await this.userModel
          .findById(residentData.family_member_id)
          .exec();
        if (!familyMember) {
          console.error(
            '[RESIDENT][CREATE] Family member not found:',
            residentData.family_member_id,
          );
          throw new BadRequestException('Family member not found');
        }
        console.log(
          '[RESIDENT][CREATE] Family member found:',
          familyMember.full_name,
        );
      }

      const createdResident = new this.residentModel(residentData);
      const savedResident = await createdResident.save();

      console.log(
        '[RESIDENT][CREATE] Successfully created resident:',
        savedResident._id,
      );
      return savedResident;
    } catch (error) {
      console.error('[RESIDENT][CREATE][ERROR]', error);
      console.error('[RESIDENT][CREATE][ERROR] Stack:', error.stack);
      throw error;
    }
  }

  // Admin lấy danh sách resident chờ duyệt
  async findPendingResidents(): Promise<Resident[]> {
    return this.residentModel.find({
      status: ResidentStatus.PENDING,
      is_deleted: false,
    }).exec();
  }
  // Admin duyệt resident (accept hoặc reject)
  async updateStatus(
    id: string,
    status: ResidentStatus.ACCEPTED | ResidentStatus.REJECTED,
  ): Promise<Resident> {
    const resident = await this.residentModel.findOne({
      _id: id,
      is_deleted: false,
    });
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    if (![ResidentStatus.ACCEPTED, ResidentStatus.REJECTED].includes(status)) {
      throw new BadRequestException('Invalid status for approval');
    }
    resident.status = status;
    resident.updated_at = new Date(new Date().getTime() + 7 * 60 * 60 * 1000); // GMT+7
    return resident.save();
  }

  // Family lấy resident đã được duyệt để hiển thị app
  async findAcceptedResidentsByFamily(familyMemberId: string): Promise<Resident[]> {
    return this.residentModel.find({
      family_member_id: new Types.ObjectId(familyMemberId),
      status: ResidentStatus.ACCEPTED,
      is_deleted: false,
    }).exec();
  }


  async findAll(): Promise<Resident[]> {
    return this.residentModel
      .find({ is_deleted: false })
      .populate('family_member_id', 'full_name email phone')
      .exec();
  }

  async findOne(id: string): Promise<Resident> {
    const resident = await this.residentModel
      .findOne({ _id: id, is_deleted: false })
      .populate('family_member_id', 'full_name email phone')
      .exec();
    if (!resident)
      throw new NotFoundException(`Resident with ID ${id} not found`);
    return resident;
  }

  async findOneWithFamily(id: string): Promise<Resident> {
    const resident = await this.residentModel
      .findOne({ _id: id, is_deleted: false })
      .populate('family_member_id', 'full_name email phone role _id')
      .exec();
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return resident;
  }

  async findAllByFamilyMemberId(familyMemberId: string): Promise<Resident[]> {
    // Đảm bảo so sánh đúng kiểu ObjectId với trường family_member_id
    return this.residentModel
      .find({ family_member_id: new Types.ObjectId(familyMemberId), is_deleted: false })
      .exec();
  }

  // async update(
  //   id: string,
  //   updateResidentDto: UpdateResidentDto,
  // ): Promise<Resident> {
  //   // Lấy dữ liệu cũ
  //   const oldResident = await this.residentModel.findById(id);
  //   if (!oldResident) {
  //     throw new NotFoundException(`Resident with ID ${id} not found`);
  //   }

  //   // Chuẩn bị dữ liệu update, tự động điền các trường required nếu không truyền lên
  //   // Hỗ trợ cả camelCase và snake_case cho discharge_date
  //   const updateData: any = { ...updateResidentDto };
  //   if (
  //     typeof updateData.dischargeDate !== 'undefined' &&
  //     typeof updateData.discharge_date === 'undefined'
  //   ) {
  //     updateData.discharge_date = updateData.dischargeDate;
  //     delete updateData.dischargeDate;
  //   }

  //   // Các trường required cần giữ nguyên nếu không truyền lên (admission_date, created_at)
  //   if (typeof updateData.admission_date === 'undefined') {
  //     updateData.admission_date = oldResident.admission_date;
  //   } else if (updateData.admission_date) {
  //     updateData.admission_date = new Date(updateData.admission_date);
  //   }
  //   if (typeof updateData.created_at === 'undefined') {
  //     updateData.created_at = oldResident.created_at;
  //   } else if (updateData.created_at) {
  //     updateData.created_at = new Date(updateData.created_at);
  //   }
  //   // updated_at luôn là giờ Việt Nam (GMT+7)
  //   const now = new Date();
  //   const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  //   updateData.updated_at = vietnamTime;

  //   // discharge_date: nếu truyền lên thì ép kiểu, nếu không thì giữ nguyên
  //   if (typeof updateData.discharge_date === 'undefined') {
  //     updateData.discharge_date = oldResident.discharge_date;
  //   } else if (
  //     updateData.discharge_date !== null &&
  //     updateData.discharge_date !== ''
  //   ) {
  //     updateData.discharge_date = new Date(updateData.discharge_date);
  //     // Nếu có ngày xuất viện được cung cấp, tự động set trạng thái đã xuất viện
  //     updateData.status = ResidentStatus.DISCHARGED;
  //   }

  //   // family_member_id: nếu truyền lên thì ép kiểu ObjectId, nếu không thì giữ nguyên
  //   if (typeof updateData.family_member_id === 'undefined') {
  //     updateData.family_member_id = oldResident.family_member_id;
  //   } else if (updateData.family_member_id) {
  //     updateData.family_member_id = new Types.ObjectId(
  //       updateData.family_member_id,
  //     );
  //   }

  //   // Nếu status được cập nhật thành 'discharged' hoặc 'deceased', tự động cập nhật discharge_date
  //   if (
  //     (updateData.status === 'discharged' ||
  //       updateData.status === 'deceased') &&
  //     oldResident.status !== updateData.status
  //   ) {
  //     updateData.discharge_date = vietnamTime;
  //   }

  //   // Nếu không truyền emergency_contact thì chỉ giữ nguyên emergency_contact cũ trong DB
  //   if (
  //     typeof updateData.emergency_contact === 'undefined' ||
  //     updateData.emergency_contact === null
  //   ) {
  //     updateData.emergency_contact = oldResident.emergency_contact;
  //   }

  //   // Ép emergency_contact về plain object nếu là instance class
  //   if (
  //     updateData.emergency_contact &&
  //     typeof updateData.emergency_contact === 'object' &&
  //     updateData.emergency_contact.name
  //   ) {
  //     updateData.emergency_contact = {
  //       name: updateData.emergency_contact.name,
  //       phone: updateData.emergency_contact.phone,
  //       relationship: updateData.emergency_contact.relationship,
  //     };
  //   }

  //   // Các trường required khác nếu không truyền lên thì giữ nguyên và clone đúng kiểu
  //   const requiredFields = [
  //     'full_name',
  //     'date_of_birth',
  //     'gender',
  //     'relationship',
  //     'medical_history',
  //     'current_medications',
  //     'allergies',
  //     'emergency_contact',
  //     'status',
  //     'admission_date',
  //     'created_at',
  //     'updated_at',
  //   ];
  //   for (const field of requiredFields) {
  //     if (typeof updateData[field] === 'undefined') {
  //       updateData[field] = oldResident[field];
  //     }
  //     // Nếu là trường date, ép lại thành Date nếu là string, nếu không hợp lệ thì lấy từ DB hoặc new Date()
  //     if (
  //       [
  //         'date_of_birth',
  //         'admission_date',
  //         'created_at',
  //         'updated_at',
  //         'discharge_date',
  //       ].includes(field)
  //     ) {
  //       if (typeof updateData[field] === 'string') {
  //         const d = new Date(updateData[field]);
  //         updateData[field] = isNaN(d.getTime())
  //           ? oldResident[field] || new Date()
  //           : d;
  //       }
  //       if (!(updateData[field] instanceof Date)) {
  //         updateData[field] = oldResident[field] || new Date();
  //       }
  //     }
  //   }

  //   // Ép family_member_id về ObjectId nếu cần
  //   if (
  //     updateData.family_member_id &&
  //     typeof updateData.family_member_id !== 'object'
  //   ) {
  //     updateData.family_member_id = new Types.ObjectId(
  //       updateData.family_member_id,
  //     );
  //   }
  //   // Ép các trường date về Date instance nếu cần và xử lý timezone
  //   [
  //     'admission_date',
  //     'created_at',
  //     'updated_at',
  //     'date_of_birth',
  //     'discharge_date',
  //   ].forEach((field) => {
  //     if (updateData[field] && !(updateData[field] instanceof Date)) {
  //       // Tạo Date object và điều chỉnh timezone về GMT+7
  //       const date = new Date(updateData[field]);
  //       const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  //       updateData[field] = vietnamTime;
  //     }
  //   });

  //   // Log lại dữ liệu updateData để debug (JSON)
  //   console.log(
  //     'Resident updateData (JSON):',
  //     JSON.stringify(updateData, null, 2),
  //   );

  //   // Tiến hành update, log lỗi chi tiết nếu có
  //   try {
  //     const updatedResident = await this.residentModel
  //       .findByIdAndUpdate(id, updateData, { new: true })
  //       .exec();
  //     if (!updatedResident) {
  //       throw new NotFoundException(`Resident with ID ${id} not found`);
  //     }
  //     return updatedResident;
  //   } catch (error) {
  //     // Log chi tiết lỗi validation
  //     console.error(
  //       'Resident update validation error:',
  //       error?.errInfo?.details?.schemaRulesNotSatisfied || error,
  //     );
  //     throw error;
  //   }
  // }
  async update(
    id: string,
    updateResidentDto: UpdateResidentDto,
    userRole: Role,
  ): Promise<Resident> {
    // Lấy dữ liệu cũ
    const oldResident = await this.residentModel.findOne({
      _id: id,
      is_deleted: false,
    });
    if (!oldResident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
  
    // Kiểm tra quyền: family chỉ được update resident chưa được duyệt (status khác accepted)
    if (
      userRole === Role.FAMILY &&
      oldResident.status === ResidentStatus.ACCEPTED
    ) {
      throw new ForbiddenException(
        'Family không được phép cập nhật resident đã được duyệt',
      );
    }
  
    // Chuẩn bị dữ liệu update, tự động điền các trường required nếu không truyền lên
    // Hỗ trợ cả camelCase và snake_case cho discharge_date
    const updateData: any = { ...updateResidentDto };
    if (
      typeof updateData.dischargeDate !== 'undefined' &&
      typeof updateData.discharge_date === 'undefined'
    ) {
      updateData.discharge_date = updateData.dischargeDate;
      delete updateData.dischargeDate;
    }
  
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
    const vietnamTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    updateData.updated_at = vietnamTime;
  
    // discharge_date: nếu truyền lên thì ép kiểu, nếu không thì giữ nguyên
    if (typeof updateData.discharge_date === 'undefined') {
      updateData.discharge_date = oldResident.discharge_date;
    } else if (
      updateData.discharge_date !== null &&
      updateData.discharge_date !== ''
    ) {
      updateData.discharge_date = new Date(updateData.discharge_date);
      // Nếu có ngày xuất viện được cung cấp, tự động set trạng thái đã xuất viện
      updateData.status = ResidentStatus.DISCHARGED;
    }
  
    // family_member_id: nếu truyền lên thì ép kiểu ObjectId, nếu không thì giữ nguyên
    if (typeof updateData.family_member_id === 'undefined') {
      updateData.family_member_id = oldResident.family_member_id;
    } else if (updateData.family_member_id) {
      updateData.family_member_id = new Types.ObjectId(updateData.family_member_id);
    }
  
    // Nếu status được cập nhật thành 'discharged' hoặc 'deceased', tự động cập nhật discharge_date
    if (
      (updateData.status === ResidentStatus.DISCHARGED ||
        updateData.status === ResidentStatus.DECEASED) &&
      oldResident.status !== updateData.status
    ) {
      updateData.discharge_date = vietnamTime;
    }
  
    // Nếu không truyền emergency_contact thì chỉ giữ nguyên emergency_contact cũ trong DB
    if (
      typeof updateData.emergency_contact === 'undefined' ||
      updateData.emergency_contact === null
    ) {
      updateData.emergency_contact = oldResident.emergency_contact;
    }
  
    // Ép emergency_contact về plain object nếu là instance class
    if (
      updateData.emergency_contact &&
      typeof updateData.emergency_contact === 'object' &&
      updateData.emergency_contact.name
    ) {
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
      if (typeof updateData[field] === 'undefined') {
        updateData[field] = oldResident[field];
      }
      // Nếu là trường date, ép lại thành Date nếu là string, nếu không hợp lệ thì lấy từ DB hoặc new Date()
      if (
        [
          'date_of_birth',
          'admission_date',
          'created_at',
          'updated_at',
          'discharge_date',
        ].includes(field)
      ) {
        if (typeof updateData[field] === 'string') {
          const d = new Date(updateData[field]);
          updateData[field] = isNaN(d.getTime())
            ? oldResident[field] || new Date()
            : d;
        }
        if (!(updateData[field] instanceof Date)) {
          updateData[field] = oldResident[field] || new Date();
        }
      }
    }
  
    // Ép family_member_id về ObjectId nếu cần
    if (
      updateData.family_member_id &&
      typeof updateData.family_member_id !== 'object'
    ) {
      updateData.family_member_id = new Types.ObjectId(updateData.family_member_id);
    }
    // Ép các trường date về Date instance nếu cần và xử lý timezone
    [
      'admission_date',
      'created_at',
      'updated_at',
      'date_of_birth',
      'discharge_date',
    ].forEach((field) => {
      if (updateData[field] && !(updateData[field] instanceof Date)) {
        // Tạo Date object và điều chỉnh timezone về GMT+7
        const date = new Date(updateData[field]);
        const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        updateData[field] = vietnamTime;
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
      console.error(
        'Resident update validation error:',
        error?.errInfo?.details?.schemaRulesNotSatisfied || error,
      );
      throw error;
    }
  }
  

  // async remove(id: string): Promise<any> {
  //   // First, unassign bed if any
  //   await this.unassignBedFromResident(id);

  //   // Find the resident to get family_member_id before deletion
  //   const resident = await this.residentModel.findById(id);
  //   if (!resident) {
  //     throw new NotFoundException(`Resident with ID ${id} not found`);
  //   }

  //   // Store family_member_id for reference (but don't delete the user account)
  //   const familyMemberId = resident.family_member_id;

  //   // Delete only the resident record, NOT the associated family member account
  //   const deletedResident = await this.residentModel
  //     .findByIdAndDelete(id)
  //     .exec();

  //   console.log(
  //     `[RESIDENT][DELETE] Deleted resident ${id}. Family member account ${familyMemberId} remains intact.`,
  //   );

  //   return {
  //     deleted: true,
  //     _id: id,
  //     message:
  //       'Resident deleted successfully. Family member account remains active.',
  //     family_member_id: familyMemberId,
  //   };
  // }

  async remove(
    id: string,
    userRole: Role,
    reason?: string,
  ): Promise<any> {
    // Kiểm tra resident tồn tại
    const resident = await this.residentModel.findOne({ _id: id, is_deleted: false });
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
  
    // Nếu là staff thì bắt buộc phải có lý do
    if (userRole === Role.STAFF && (!reason || reason.trim() === '')) {
      throw new BadRequestException('Staff phải cung cấp lý do khi xóa resident');
    }
  
    // Nếu là staff, ghi log hoặc lưu lý do xóa
    if (userRole === Role.STAFF) {
      // Ví dụ ghi log console (bạn có thể thay bằng lưu DB hoặc gửi notification)
      console.log(`[RESIDENT][DELETE] Staff xóa resident ${id} với lý do: ${reason}`);
      // Nếu bạn có collection logs, có thể lưu ở đây
      // await this.logModel.create({ residentId: id, userRole, reason, timestamp: new Date() });
    }

    resident.is_deleted = true;
  resident.deleted_at = new Date(new Date().getTime() + 7 * 60 * 60 * 1000); // GMT+7
  resident.deleted_reason = reason || null;

  await resident.save();
  
    // Unassign bed nếu có
    await this.unassignBedFromResident(id);
  
    // Xóa resident
    // await this.residentModel.findByIdAndDelete(id).exec();
  
    return {
      deleted: true,
      _id: id,
      message: 'Resident soft deleted successfully. Family member account remains active.',
      family_member_id: resident.family_member_id,
      deletedBy: userRole,
      reason: reason || null,
    };
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
    const allOccupied = allBeds.every((b) => b.status === 'occupied');
    // Cập nhật status room
    await this.roomsService.update(room_id.toString(), {
      status: allOccupied ? 'occupied' : 'available',
    });

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
