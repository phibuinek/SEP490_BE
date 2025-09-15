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
  Gender,
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
import { CacheService } from '../common/cache.service';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident.name) private residentModel: Model<ResidentDocument>,
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
    private roomsService: RoomsService,
    @InjectModel('User') private userModel: Model<UserDocument>,
    private cacheService: CacheService,
  ) {}

  // Điểm danh: nếu có mặt tại cơ sở -> chuyển sang ADMITTED
  async markAttendancePresent(id: string): Promise<Resident> {
    const resident = await this.residentModel.findOne({ _id: id, is_deleted: false });
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }

    if (resident.status !== ResidentStatus.ACTIVE) {
      throw new BadRequestException('Only ACTIVE residents can be marked admitted');
    }

    resident.status = ResidentStatus.ADMITTED;
    resident.updated_at = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    await resident.save();
    return resident;
  }

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

      // Kiểm tra CCCD của family member trước khi cho phép đăng ký resident
      if (!createResidentDto.family_member_id) {
        throw new BadRequestException('Thiếu family_member_id');
      }
      const familyMember = await this.userModel
        .findById(createResidentDto.family_member_id)
        .exec();
      if (!familyMember) {
        throw new NotFoundException('Không tìm thấy tài khoản gia đình');
      }
      if (
        !familyMember.cccd_id ||
        !familyMember.cccd_front ||
        !familyMember.cccd_back
      ) {
        throw new BadRequestException(
          'Tài khoản gia đình chưa cung cấp đủ thông tin CCCD (cccd_id, ảnh mặt trước, ảnh mặt sau). Vui lòng cập nhật CCCD trước khi đăng ký resident.',
        );
      }

      // Bỏ bắt buộc care_plan_assignment_id. Resident có thể được tạo trước,
      // care plan assignment sẽ được tạo ở API riêng.
      if (residentData.care_plan_assignment_id) {
        try {
          residentData.care_plan_assignment_id = new Types.ObjectId(
            residentData.care_plan_assignment_id,
          );
        } catch (error) {
          // Nếu không hợp lệ thì set null thay vì throw để không chặn tạo resident
          residentData.care_plan_assignment_id = null;
        }
      } else {
        residentData.care_plan_assignment_id = null;
      }

      // Xử lý date_of_birth: ép về Date object
      if (residentData.date_of_birth) {
        if (typeof residentData.date_of_birth === 'string') {
          residentData.date_of_birth = new Date(residentData.date_of_birth);
        }
        if (!(residentData.date_of_birth instanceof Date) || isNaN(residentData.date_of_birth.getTime())) {
          throw new BadRequestException('Invalid date_of_birth format');
        }
      } else {
        throw new BadRequestException('date_of_birth is required');
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

      // Ép family_member_id về ObjectId nếu là string - REQUIRED FIELD
      if (!residentData.family_member_id) {
        throw new BadRequestException('family_member_id is required');
      }
      
      if (typeof residentData.family_member_id === 'string') {
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

      // family_member_id đã được xử lý ở trên

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
      } else {
        // Filter out empty objects and ensure proper structure
        residentData.current_medications = residentData.current_medications.filter(med => {
          return med && typeof med === 'object' && Object.keys(med).length > 0;
        });
        console.log(
          '[RESIDENT][CREATE] Filtered current_medications:',
          residentData.current_medications,
        );
      }

      // Xử lý allergies: nếu không có hoặc rỗng thì gán mảng rỗng
      if (!residentData.allergies || !Array.isArray(residentData.allergies)) {
        residentData.allergies = [];
        console.log('[RESIDENT][CREATE] Set allergies to empty array');
      }

      // Xử lý emergency_contact: chỉ reset nếu thực sự không có dữ liệu
      console.log('[RESIDENT][CREATE] Emergency contact debug:');
      console.log('- emergency_contact exists:', !!residentData.emergency_contact);
      console.log('- emergency_contact type:', typeof residentData.emergency_contact);
      console.log('- emergency_contact value:', residentData.emergency_contact);
      
      if (!residentData.emergency_contact) {
        // Chỉ tạo object rỗng nếu hoàn toàn không có emergency_contact
        residentData.emergency_contact = {
          name: "",
          phone: "0000000000", // 10 digits to match pattern ^[0-9]{10,15}$
          relationship: ""
        };
        console.log('[RESIDENT][CREATE] Set emergency_contact to empty object (no data provided)');
      } else if (typeof residentData.emergency_contact === 'object' && residentData.emergency_contact !== null) {
        // Validate emergency contact structure - chỉ validate phone, không reset toàn bộ object
        const ec = residentData.emergency_contact;
        console.log('[RESIDENT][CREATE] Validating emergency contact:', ec);
        
        // Chỉ validate phone nếu có phone, không reset toàn bộ object
        if (ec.phone && !/^[0-9]{10,15}$/.test(ec.phone)) {
          console.warn('[RESIDENT][CREATE] Invalid emergency contact phone format:', ec.phone);
          // Chỉ reset phone, giữ nguyên name và relationship
          ec.phone = "0000000000";
          console.log('[RESIDENT][CREATE] Fixed phone number, kept other fields:', ec);
        }
        
        // Đảm bảo có đủ 3 trường required cho MongoDB
        if (!ec.name || ec.name.trim() === "") ec.name = "Chưa cập nhật";
        if (!ec.phone) ec.phone = "0000000000";
        if (!ec.relationship || ec.relationship.trim() === "") ec.relationship = "Chưa cập nhật";
        
        console.log('[RESIDENT][CREATE] Final emergency contact after validation:', ec);
      }

      console.log(
        '[RESIDENT][CREATE] Final residentData before save:',
        JSON.stringify(residentData, null, 2),
      );

      // Debug từng trường quan trọng
      console.log('[RESIDENT][CREATE] Debug fields:');
      console.log('- emergency_contact:', residentData.emergency_contact);
      console.log('- current_medications:', residentData.current_medications);
      console.log('- allergies:', residentData.allergies);
      console.log('- cccd_id:', residentData.cccd_id);
      console.log('- user_cccd_id:', residentData.user_cccd_id);
      
      // Debug validation fields
      console.log('[RESIDENT][CREATE] Validation debug:');
      console.log('- full_name type:', typeof residentData.full_name, 'value:', residentData.full_name);
      console.log('- date_of_birth type:', typeof residentData.date_of_birth, 'value:', residentData.date_of_birth);
      console.log('- gender type:', typeof residentData.gender, 'value:', residentData.gender);
      console.log('- relationship type:', typeof residentData.relationship, 'value:', residentData.relationship);
      console.log('- status type:', typeof residentData.status, 'value:', residentData.status);
      console.log('- admission_date type:', typeof residentData.admission_date, 'value:', residentData.admission_date);
      console.log('- family_member_id type:', typeof residentData.family_member_id, 'value:', residentData.family_member_id);
      
      // Xử lý CCCD fields: nếu không có thì gán null
      if (!residentData.cccd_id) {
        residentData.cccd_id = null;
        console.log('[RESIDENT][CREATE] Set cccd_id to null');
      }
      if (!residentData.cccd_front) {
        residentData.cccd_front = null;
        console.log('[RESIDENT][CREATE] Set cccd_front to null');
      }
      if (!residentData.cccd_back) {
        residentData.cccd_back = null;
        console.log('[RESIDENT][CREATE] Set cccd_back to null');
      }
      if (!residentData.user_cccd_id) {
        residentData.user_cccd_id = null;
        console.log('[RESIDENT][CREATE] Set user_cccd_id to null');
      }
      if (!residentData.user_cccd_front) {
        residentData.user_cccd_front = null;
        console.log('[RESIDENT][CREATE] Set user_cccd_front to null');
      }
      if (!residentData.user_cccd_back) {
        residentData.user_cccd_back = null;
        console.log('[RESIDENT][CREATE] Set user_cccd_back to null');
      }

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

      // Validate all required fields before creating model
      console.log('[RESIDENT][CREATE] Validating required fields...');
      const requiredFields = ['full_name', 'date_of_birth', 'gender', 'relationship', 'family_member_id', 'status', 'admission_date', 'created_at', 'updated_at'];
      const missingFields = requiredFields.filter(field => {
        const value = residentData[field];
        return value === undefined || value === null || value === '';
      });
      
      if (missingFields.length > 0) {
        console.error('[RESIDENT][CREATE] Missing required fields:', missingFields);
        throw new BadRequestException(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Additional validation for string fields
      if (typeof residentData.full_name !== 'string' || residentData.full_name.trim() === '') {
        throw new BadRequestException('full_name must be a non-empty string');
      }
      
      if (typeof residentData.relationship !== 'string' || residentData.relationship.trim() === '') {
        throw new BadRequestException('relationship must be a non-empty string');
      }
      
      // Validate gender enum
      if (!Object.values(Gender).includes(residentData.gender)) {
        throw new BadRequestException(`Invalid gender. Must be one of: ${Object.values(Gender).join(', ')}`);
      }
      
      // Validate status enum
      if (!Object.values(ResidentStatus).includes(residentData.status)) {
        throw new BadRequestException(`Invalid status. Must be one of: ${Object.values(ResidentStatus).join(', ')}`);
      }

      console.log('[RESIDENT][CREATE] All validations passed, creating model instance...');
      
      // Check if there are any MongoDB collection validation rules
      console.log('[RESIDENT][CREATE] Checking MongoDB collection validation rules...');
      try {
        const collection = this.residentModel.collection;
        console.log('[RESIDENT][CREATE] Collection name:', collection.collectionName);
      } catch (statsError) {
        console.log('[RESIDENT][CREATE] Could not get collection info:', statsError.message);
      }
      
      // Final data structure validation
      const finalData = {
        ...residentData,
        // Ensure all dates are Date objects
        date_of_birth: residentData.date_of_birth instanceof Date ? residentData.date_of_birth : new Date(residentData.date_of_birth),
        admission_date: residentData.admission_date instanceof Date ? residentData.admission_date : new Date(residentData.admission_date),
        created_at: residentData.created_at instanceof Date ? residentData.created_at : new Date(residentData.created_at),
        updated_at: residentData.updated_at instanceof Date ? residentData.updated_at : new Date(residentData.updated_at),
        // Ensure family_member_id is ObjectId
        family_member_id: residentData.family_member_id instanceof Types.ObjectId ? residentData.family_member_id : new Types.ObjectId(residentData.family_member_id),
        // Ensure soft delete fields are set
        is_deleted: residentData.is_deleted !== undefined ? residentData.is_deleted : false,
        deleted_at: residentData.deleted_at || null,
        deleted_reason: residentData.deleted_reason || null,
        // Ensure discharge_date is properly handled
        discharge_date: residentData.discharge_date || null,
        // Ensure all optional fields are properly set
        avatar: residentData.avatar || null,
        cccd_id: residentData.cccd_id || null,
        cccd_front: residentData.cccd_front || null,
        cccd_back: residentData.cccd_back || null,
        user_cccd_id: residentData.user_cccd_id || null,
        user_cccd_front: residentData.user_cccd_front || null,
        user_cccd_back: residentData.user_cccd_back || null,
        medical_history: residentData.medical_history || null,
        current_medications: residentData.current_medications || [],
        allergies: residentData.allergies || [],
        emergency_contact: residentData.emergency_contact || {
          name: "",
          phone: "0000000000", // 10 digits to match pattern ^[0-9]{10,15}$
          relationship: ""
        },
      };
      
      console.log('[RESIDENT][CREATE] Final processed data:', JSON.stringify(finalData, null, 2));
      
      // Debug each field type and value
      console.log('[RESIDENT][CREATE] Field type debugging:');
      Object.keys(finalData).forEach(key => {
        const value = finalData[key];
        console.log(`- ${key}: type=${typeof value}, value=${value}, isDate=${value instanceof Date}, isObjectId=${value instanceof Types.ObjectId}`);
      });
      
      const createdResident = new this.residentModel(finalData);
      
      console.log('[RESIDENT][CREATE] Model instance created, attempting to save...');
      const validationErrors = createdResident.validateSync();
      if (validationErrors) {
        console.error('[RESIDENT][CREATE] Model validation errors:', validationErrors);
        console.error('[RESIDENT][CREATE] Validation error details:');
        Object.keys(validationErrors.errors).forEach(key => {
          console.error(`  - ${key}: ${validationErrors.errors[key].message}`);
        });
        throw new BadRequestException(`Validation failed: ${validationErrors.message}`);
      }
      console.log('[RESIDENT][CREATE] Model validation passed');
      
      // Log the actual document that will be saved
      console.log('[RESIDENT][CREATE] Document to be saved:', JSON.stringify(createdResident.toObject(), null, 2));
      
      // Try to save with detailed error handling
      try {
        const savedResident = await createdResident.save();
        console.log('[RESIDENT][CREATE] Save successful');
      return savedResident;
      } catch (saveError) {
        console.error('[RESIDENT][CREATE] Save error details:');
        console.error('- Error name:', saveError.name);
        console.error('- Error message:', saveError.message);
        console.error('- Error code:', saveError.code);
        
        if (saveError.name === 'MongoServerError') {
          console.error('- MongoDB error code:', saveError.code);
          console.error('- MongoDB error message:', saveError.message);
          if (saveError.errInfo) {
            console.error('- MongoDB error info:', JSON.stringify(saveError.errInfo, null, 2));
          }
          if (saveError.writeErrors) {
            console.error('- MongoDB write errors:', JSON.stringify(saveError.writeErrors, null, 2));
          }
        }
        
        // Try to identify which field is causing the issue
        console.log('[RESIDENT][CREATE] Attempting to identify problematic field...');
        const testFields = ['full_name', 'date_of_birth', 'gender', 'relationship', 'family_member_id', 'status', 'admission_date', 'created_at', 'updated_at'];
        
        for (const field of testFields) {
          try {
            const testDoc = new this.residentModel({ [field]: finalData[field] });
            testDoc.validateSync();
            console.log(`✓ Field ${field} is valid`);
          } catch (fieldError) {
            console.error(`✗ Field ${field} is invalid:`, fieldError.message);
          }
        }
        
        // Try to create a minimal valid document
        console.log('[RESIDENT][CREATE] Attempting to create minimal valid document...');
        try {
          const minimalDoc = new this.residentModel({
            full_name: 'Test Resident',
            date_of_birth: new Date('1950-01-01'),
            gender: 'male',
            relationship: 'test',
            family_member_id: finalData.family_member_id,
            status: 'active',
            admission_date: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
            emergency_contact: {
              name: "",
              phone: "0000000000",
              relationship: ""
            },
            current_medications: [],
            allergies: [],
            medical_history: null,
            avatar: null,
            cccd_id: null,
            cccd_front: null,
            cccd_back: null,
            user_cccd_id: null,
            user_cccd_front: null,
            user_cccd_back: null,
            discharge_date: null,
            is_deleted: false,
            deleted_at: null,
            deleted_reason: null,
          });
          minimalDoc.validateSync();
          console.log('✓ Minimal document is valid');
          
          // Try to save minimal document
          console.log('[RESIDENT][CREATE] Attempting to save minimal document...');
          const savedMinimal = await minimalDoc.save();
          console.log('✓ Minimal document saved successfully:', savedMinimal._id);
        } catch (minimalError) {
          console.error('✗ Minimal document error:', minimalError.message);
          if (minimalError.name === 'MongoServerError') {
            console.error('✗ Minimal document MongoDB error:', JSON.stringify(minimalError.errInfo, null, 2));
          }
        }
        
        throw saveError;
      }
    } catch (error) {
      console.error('[RESIDENT][CREATE][ERROR]', error);
      console.error('[RESIDENT][CREATE][ERROR] Stack:', error.stack);
      
      // Log detailed validation error information
      if (error.name === 'ValidationError') {
        console.error('[RESIDENT][CREATE][VALIDATION_ERROR] Details:');
        Object.keys(error.errors).forEach(key => {
          console.error(`- ${key}:`, error.errors[key].message);
        });
      }
      
      // Log MongoDB specific errors
      if (error.name === 'MongoServerError') {
        console.error('[RESIDENT][CREATE][MONGO_ERROR] Code:', error.code);
        console.error('[RESIDENT][CREATE][MONGO_ERROR] Message:', error.message);
        if (error.errInfo) {
          console.error('[RESIDENT][CREATE][MONGO_ERROR] Error Info:', JSON.stringify(error.errInfo, null, 2));
        }
      }
      
      throw error;
    }
  }

  // Admin lấy danh sách resident active
  async findActiveResidents(): Promise<Resident[]> {
    return this.residentModel.find({
      status: ResidentStatus.ACTIVE,
      is_deleted: false,
    }).exec();
  }
  
  // Admin cập nhật status resident (accept/reject)
  async updateStatus(
    id: string,
    status: ResidentStatus.ACCEPTED | ResidentStatus.REJECTED,
    reason?: string,
  ): Promise<Resident> {
    console.log(`[SERVICE] Updating resident ${id} status to ${status}`);
    
    // Kiểm tra ID resident có tồn tại không
    const resident = await this.residentModel.findOne({
      _id: id,
      is_deleted: false,
    });
    
    if (!resident) {
      console.log(`[SERVICE] Resident with ID ${id} not found`);
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    
    console.log(`[SERVICE] Found resident: ${resident.full_name}, current status: ${resident.status}`);
    
    // Chỉ cho phép cập nhật status nếu resident đang ở trạng thái pending
    if (resident.status !== ResidentStatus.PENDING) {
      console.log(`[SERVICE] Resident ${id} is not in pending status, current: ${resident.status}`);
      throw new BadRequestException(`Resident is not in pending status. Current status: ${resident.status}`);
    }
    
    // Validate status
    if (status !== ResidentStatus.ACCEPTED && status !== ResidentStatus.REJECTED) {
      console.log(`[SERVICE] Invalid status: ${status}`);
      throw new BadRequestException('Status must be either "accepted" or "rejected"');
    }
    
    // Cập nhật status
    resident.status = status;
    resident.updated_at = new Date(new Date().getTime() + 7 * 60 * 60 * 1000); // GMT+7
    
    // Nếu reject thì lưu lý do
    if (status === ResidentStatus.REJECTED && reason) {
      resident.deleted_reason = reason;
      console.log(`[SERVICE] Rejection reason: ${reason}`);
    }
    
    console.log(`[SERVICE] Updating resident ${id} to status: ${status}`);
    const updatedResident = await resident.save();
    console.log(`[SERVICE] Resident ${id} status updated successfully to: ${updatedResident.status}`);
    
    return updatedResident;
  }

  // Family lấy resident active để hiển thị app
  async findActiveResidentsByFamily(familyMemberId: string): Promise<Resident[]> {
    return this.residentModel.find({
      family_member_id: new Types.ObjectId(familyMemberId),
      status: ResidentStatus.ACTIVE,
      is_deleted: false,
    }).exec();
  }

  // Admin/Staff: lấy tất cả residents đang chờ duyệt
  async findPendingResidents(): Promise<Resident[]> {
    return this.residentModel
      .find({ status: ResidentStatus.PENDING, is_deleted: false })
      .populate('family_member_id', 'full_name email phone cccd_id cccd_front cccd_back')
      .exec();
  }

  // Lấy danh sách resident ở trạng thái pending kèm thông tin đăng ký gói dịch vụ (care plan assignments)
  async findPendingWithRegistrations(): Promise<any[]> {
    const results = await this.residentModel.aggregate([
      {
        $match: { status: ResidentStatus.PENDING, is_deleted: false },
      },
      {
        $lookup: {
          from: 'care_plan_assignments',
          localField: '_id',
          foreignField: 'resident_id',
          as: 'registrations',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'family_member_id',
          foreignField: '_id',
          as: 'family_member',
        },
      },
      { $unwind: { path: '$family_member', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          full_name: 1,
          date_of_birth: 1,
          gender: 1,
          avatar: 1,
          admission_date: 1,
          family_member_id: 1,
          relationship: 1,
          emergency_contact: 1,
          cccd_id: 1,
          cccd_front: 1,
          cccd_back: 1,
          status: 1,
          created_at: 1,
          updated_at: 1,
          family_member: {
            _id: 1,
            full_name: 1,
            email: 1,
            phone: 1,
            cccd_id: 1,
            cccd_front: 1,
            cccd_back: 1,
          },
          registrations: 1,
        },
      },
      { $sort: { created_at: -1 } },
    ]);

    return results;
  }

  // Admin/Staff: lấy tất cả residents đã được duyệt
  async findAllAccepted(): Promise<Resident[]> {
    return this.residentModel
      .find({ status: ResidentStatus.ACCEPTED, is_deleted: false })
      .populate('family_member_id', 'full_name email phone cccd_id cccd_front cccd_back')
      .exec();
  }


  async findAll(pagination: PaginationDto = new PaginationDto()): Promise<PaginatedResponse<Resident>> {
    const notDeleted = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] } as any;
    
    // Generate cache key
    const cacheKey = CacheService.generateResidentsListKey({ ...pagination, notDeleted });
    
    // Try to get from cache first
    const cachedResult = await this.cacheService.get<PaginatedResponse<Resident>>(cacheKey);
    if (cachedResult) {
      console.log('[RESIDENT][FINDALL] Cache hit for key:', cacheKey);
      return cachedResult;
    }

    console.log('[RESIDENT][FINDALL] Cache miss, querying database...');
    
    // Query database
    const [data, total] = await Promise.all([
      this.residentModel
        .find(notDeleted)
        .populate('family_member_id', 'full_name email phone cccd_id cccd_front cccd_back')
        .sort(pagination.sort)
        .skip(pagination.skip)
        .limit(pagination.limit || 10)
        .lean() // Use lean() for better performance
        .exec(),
      this.residentModel.countDocuments(notDeleted).exec(),
    ]);

    const result = new PaginatedResponse(data, total, pagination);
    
    // Cache the result for 5 minutes
    await this.cacheService.set(cacheKey, result, 300);
    
    return result;
  }

  async findOne(id: string): Promise<Resident> {
    // Try to get from cache first
    const cacheKey = CacheService.generateResidentKey(id);
    const cachedResident = await this.cacheService.get<Resident>(cacheKey);
    if (cachedResident) {
      console.log('[RESIDENT][FINDONE] Cache hit for key:', cacheKey);
      return cachedResident;
    }

    console.log('[RESIDENT][FINDONE] Cache miss, querying database...');
    
    const notDeleted = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] } as any;
    const resident = await this.residentModel
      .findOne({ _id: id, ...notDeleted })
      .populate('family_member_id', 'full_name email phone cccd_id cccd_front cccd_back')
      .lean() // Use lean() for better performance
      .exec();
      
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }

    // Cache the result for 10 minutes
    await this.cacheService.set(cacheKey, resident, 600);
    
    return resident;
  }

  async findOneWithFamily(id: string): Promise<Resident> {
    const notDeleted = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] } as any;
    const resident = await this.residentModel
      .findOne({ _id: id, ...notDeleted })
      .populate('family_member_id', 'full_name email phone role _id cccd_id cccd_front cccd_back')
      .exec();
    if (!resident) {
      throw new NotFoundException(`Resident with ID ${id} not found`);
    }
    return resident;
  }

  async findAllByFamilyMemberId(familyMemberId: string): Promise<Resident[]> {
    // Đảm bảo so sánh đúng kiểu ObjectId với trường family_member_id
    const notDeleted = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] } as any;
    return this.residentModel
      .find({ family_member_id: new Types.ObjectId(familyMemberId), ...notDeleted })
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
  
    // Kiểm tra quyền: family chỉ được update resident active
    if (
      userRole === Role.FAMILY &&
      oldResident.status !== ResidentStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'Family chỉ được phép cập nhật resident đang active',
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
    console.log('[RESIDENT][UPDATE] updateData (JSON):', JSON.stringify(updateData, null, 2));
    
    // Debug validation fields for update
    console.log('[RESIDENT][UPDATE] Validation debug:');
    console.log('- full_name type:', typeof updateData.full_name, 'value:', updateData.full_name);
    console.log('- date_of_birth type:', typeof updateData.date_of_birth, 'value:', updateData.date_of_birth);
    console.log('- gender type:', typeof updateData.gender, 'value:', updateData.gender);
    console.log('- relationship type:', typeof updateData.relationship, 'value:', updateData.relationship);
    console.log('- status type:', typeof updateData.status, 'value:', updateData.status);
    console.log('- admission_date type:', typeof updateData.admission_date, 'value:', updateData.admission_date);
    console.log('- family_member_id type:', typeof updateData.family_member_id, 'value:', updateData.family_member_id);
  
    // Tiến hành update, log lỗi chi tiết nếu có
    try {
      console.log('[RESIDENT][UPDATE] Attempting to update resident...');
      const updatedResident = await this.residentModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      if (!updatedResident) {
        throw new NotFoundException(`Resident with ID ${id} not found`);
      }
      console.log('[RESIDENT][UPDATE] Successfully updated resident:', updatedResident._id);
      return updatedResident;
    } catch (error) {
      console.error('[RESIDENT][UPDATE][ERROR]', error);
      console.error('[RESIDENT][UPDATE][ERROR] Stack:', error.stack);
      
      // Log detailed validation error information
      if (error.name === 'ValidationError') {
        console.error('[RESIDENT][UPDATE][VALIDATION_ERROR] Details:');
        Object.keys(error.errors).forEach(key => {
          console.error(`- ${key}:`, error.errors[key].message);
        });
      }
      
      // Log MongoDB specific errors
      if (error.name === 'MongoServerError') {
        console.error('[RESIDENT][UPDATE][MONGO_ERROR] Code:', error.code);
        console.error('[RESIDENT][UPDATE][MONGO_ERROR] Message:', error.message);
        if (error.errInfo) {
          console.error('[RESIDENT][UPDATE][MONGO_ERROR] Error Info:', JSON.stringify(error.errInfo, null, 2));
        }
      }
      
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

  // Admin method for getting pending residents
  async getPendingResidents(): Promise<Resident[]> {
    try {
      return await this.residentModel
        .find({ 
          status: ResidentStatus.PENDING,
          is_deleted: false 
        })
        .populate('family_member_id', 'name email phone')
        .sort({ created_at: -1 })
        .exec();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to get pending residents: ${error.message}`,
      );
    }
  }
}
