import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ServiceRequest,
  ServiceRequestDocument,
  ServiceRequestStatus,
  ServiceRequestType,
} from './schemas/service-request.schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
import { Role } from '../common/enums/role.enum';
import { CarePlanAssignment, CarePlanAssignmentDocument } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';
import { MailService } from '../common/mail.service';
import { Room, RoomDocument } from '../rooms/schemas/room.schema';
import { Bed, BedDocument } from '../beds/schemas/bed.schema';
import { CarePlan, CarePlanDocument } from '../care-plans/schemas/care-plan.schema';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectModel(ServiceRequest.name)
    private serviceRequestModel: Model<ServiceRequestDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<CarePlanAssignmentDocument>,
    @InjectModel(BedAssignment.name)
    private bedAssignmentModel: Model<BedAssignmentDocument>,
    @InjectModel(Room.name)
    private roomModel: Model<RoomDocument>,
    @InjectModel(Bed.name)
    private bedModel: Model<BedDocument>,
    private mailService: MailService,
  ) {}

  /**
   * Ensure we always use a proper ObjectId even when fields are populated.
   */
  private toObjectId(id: any): Types.ObjectId {
    if (!id) {
      throw new BadRequestException('Invalid id');
    }
    if (id instanceof Types.ObjectId) return id;
    if (typeof id === 'string') return new Types.ObjectId(id);
    if (id._id) return new Types.ObjectId(id._id);
    // Fallback to string cast if possible
    return new Types.ObjectId(id.toString());
  }

  async create(dto: CreateServiceRequestDto, user?: { userId: string; role: string }): Promise<ServiceRequest> {
    // Only family can create request for their own resident
    if (!user || user.role !== Role.FAMILY) {
      throw new ForbiddenException('Chỉ family mới được tạo yêu cầu');
    }

    if (!Types.ObjectId.isValid(dto.resident_id)) {
      throw new BadRequestException('resident_id không hợp lệ');
    }

    // Validate resident belongs to this family
    const resident = await this.residentModel.findById(dto.resident_id).exec();
    if (!resident) throw new NotFoundException('Resident không tồn tại');
    if (resident.family_member_id?.toString() !== user.userId) {
      throw new ForbiddenException('Bạn không thể tạo yêu cầu cho cư dân không thuộc gia đình bạn');
    }

    // Validate note is required for CARE_PLAN_CHANGE and ROOM_CHANGE
    if ((dto.request_type === ServiceRequestType.CARE_PLAN_CHANGE || dto.request_type === ServiceRequestType.ROOM_CHANGE) && !dto.note) {
      throw new BadRequestException('Lý do yêu cầu là bắt buộc cho loại yêu cầu này');
    }

    // Validate required fields for CARE_PLAN_CHANGE
    if (dto.request_type === ServiceRequestType.CARE_PLAN_CHANGE) {
      if (!dto.target_care_plan_assignment_id) {
        throw new BadRequestException('Thiếu target_care_plan_assignment_id');
      }
      if (!dto.target_bed_assignment_id) {
        throw new BadRequestException('Thiếu target_bed_assignment_id');
      }
    }

    // Validate required fields for SERVICE_DATE_CHANGE
    if (dto.request_type === ServiceRequestType.SERVICE_DATE_CHANGE) {
      if (!dto.current_care_plan_assignment_id) {
        throw new BadRequestException('Thiếu current_care_plan_assignment_id');
      }
      if (!dto.current_bed_assignment_id) {
        throw new BadRequestException('Thiếu current_bed_assignment_id');
      }
      if (!dto.new_end_date) {
        throw new BadRequestException('Thiếu new_end_date');
      }
    }

    // Validate required fields for ROOM_CHANGE
    if (dto.request_type === ServiceRequestType.ROOM_CHANGE) {
      if (!dto.target_bed_assignment_id) {
        throw new BadRequestException('Thiếu target_bed_assignment_id');
      }
    }

    // Create the service request based on type
    let serviceRequest: ServiceRequest;

    switch (dto.request_type) {
      case ServiceRequestType.CARE_PLAN_CHANGE:
        serviceRequest = await this.createCarePlanChangeRequest(dto, user.userId);
        break;
      case ServiceRequestType.SERVICE_DATE_CHANGE:
        serviceRequest = await this.createServiceDateChangeRequest(dto, user.userId);
        break;
      case ServiceRequestType.ROOM_CHANGE:
        serviceRequest = await this.createRoomChangeRequest(dto, user.userId);
        break;
      default:
        throw new BadRequestException('Loại yêu cầu không hợp lệ');
    }

    return serviceRequest;
  }

  private async createCarePlanChangeRequest(dto: CreateServiceRequestDto, familyMemberId: string): Promise<ServiceRequest> {
    // Validate required fields for care plan change
    if (!dto.target_care_plan_assignment_id) {
      throw new BadRequestException('Thiếu target_care_plan_assignment_id cho care plan change');
    }
    if (!dto.target_bed_assignment_id) {
      throw new BadRequestException('Thiếu target_bed_assignment_id cho care plan change');
    }

    const payload = {
      resident_id: new Types.ObjectId(dto.resident_id),
      family_member_id: new Types.ObjectId(familyMemberId),
      request_type: ServiceRequestType.CARE_PLAN_CHANGE,
      note: dto.note,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      medicalNote: dto.medicalNote,
      status: ServiceRequestStatus.PENDING,
      target_care_plan_assignment_id: new Types.ObjectId(dto.target_care_plan_assignment_id),
      target_bed_assignment_id: new Types.ObjectId(dto.target_bed_assignment_id),
    };

    return new this.serviceRequestModel(payload).save();
  }

  private async createServiceDateChangeRequest(dto: CreateServiceRequestDto, familyMemberId: string): Promise<ServiceRequest> {
    const payload = {
      resident_id: new Types.ObjectId(dto.resident_id),
      family_member_id: new Types.ObjectId(familyMemberId),
      request_type: ServiceRequestType.SERVICE_DATE_CHANGE,
      note: dto.note,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      medicalNote: dto.medicalNote,
      status: ServiceRequestStatus.PENDING,
      current_care_plan_assignment_id: new Types.ObjectId(dto.current_care_plan_assignment_id!),
      current_bed_assignment_id: new Types.ObjectId(dto.current_bed_assignment_id!),
      new_end_date: new Date(dto.new_end_date!),
    };

    return new this.serviceRequestModel(payload).save();
  }

  private async createRoomChangeRequest(dto: CreateServiceRequestDto, familyMemberId: string): Promise<ServiceRequest> {
    // Validate required fields for room change
    if (!dto.target_bed_assignment_id) {
      throw new BadRequestException('Thiếu target_bed_assignment_id cho room change');
    }

    const payload = {
      resident_id: new Types.ObjectId(dto.resident_id),
      family_member_id: new Types.ObjectId(familyMemberId),
      request_type: ServiceRequestType.ROOM_CHANGE,
      note: dto.note,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      medicalNote: dto.medicalNote,
      status: ServiceRequestStatus.PENDING,
      target_bed_assignment_id: new Types.ObjectId(dto.target_bed_assignment_id),
    };

    return new this.serviceRequestModel(payload).save();
  }

  async findAll(status?: string): Promise<ServiceRequest[]> {
    const filter = status ? { status } : {};
    return this.serviceRequestModel
      .find(filter)
      .populate('resident_id', 'full_name email phone cccd_id admission_date')
      .populate('family_member_id', 'full_name email phone')
      .populate({
        path: 'target_care_plan_assignment_id',
        select: 'care_plan_ids care_plans_monthly_cost total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .populate({
        path: 'target_bed_assignment_id',
        select: 'bed_id assigned_date status',
        populate: {
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number floor room_type gender capacity'
          }
        }
      })
      .populate({
        path: 'current_care_plan_assignment_id',
        select: 'care_plan_ids care_plans_monthly_cost total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .populate({
        path: 'current_bed_assignment_id',
        select: 'bed_id assigned_date unassigned_date status',
        populate: {
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number floor room_type gender capacity'
          }
        }
      })
      .exec();
  }

  async findAllByFamily(familyMemberId: string): Promise<ServiceRequest[]> {
    if (!Types.ObjectId.isValid(familyMemberId)) {
      throw new BadRequestException('familyMemberId không hợp lệ');
    }
    return this.serviceRequestModel
      .find({ family_member_id: new Types.ObjectId(familyMemberId) })
      .populate('resident_id', 'full_name email phone cccd_id admission_date')
      .populate('family_member_id', 'full_name email phone')
      .populate({
        path: 'target_care_plan_assignment_id',
        select: 'care_plan_ids care_plans_monthly_cost total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .populate({
        path: 'target_bed_assignment_id',
        select: 'bed_id assigned_date status',
        populate: {
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number floor room_type gender capacity'
          }
        }
      })
      .populate({
        path: 'current_care_plan_assignment_id',
        select: 'care_plan_ids total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .exec();
  }

  async findOne(id: string): Promise<ServiceRequest> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }
    
    const serviceRequest = await this.serviceRequestModel
      .findById(id)
      .populate('resident_id', 'full_name email phone cccd_id admission_date')
      .populate('family_member_id', 'full_name email phone')
      .populate({
        path: 'target_care_plan_assignment_id',
        select: 'care_plan_ids care_plans_monthly_cost total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .populate({
        path: 'target_bed_assignment_id',
        select: 'bed_id assigned_date status',
        populate: {
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number floor room_type gender capacity'
          }
        }
      })
      .populate({
        path: 'current_care_plan_assignment_id',
        select: 'care_plan_ids care_plans_monthly_cost total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .populate({
        path: 'current_bed_assignment_id',
        select: 'bed_id assigned_date unassigned_date status',
        populate: {
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number floor room_type gender capacity'
          }
        }
      })
      .exec();

    if (!serviceRequest) {
      throw new NotFoundException('ServiceRequest không tồn tại');
    }

    return serviceRequest;
  }

  async approve(id: string): Promise<ServiceRequest> {
    const req = await this.serviceRequestModel
      .findById(id)
      .populate('resident_id', 'full_name family_member_id admission_date')
      .populate('family_member_id', 'full_name email')
      .populate({
        path: 'target_care_plan_assignment_id',
        select: 'care_plan_ids care_plans_monthly_cost total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .populate({
        path: 'target_bed_assignment_id',
        select: 'bed_id assigned_date status',
        populate: {
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number floor room_type gender capacity'
          }
        }
      })
      .populate({
        path: 'current_care_plan_assignment_id',
        select: 'care_plan_ids care_plans_monthly_cost total_monthly_cost start_date end_date status',
        populate: {
          path: 'care_plan_ids',
          select: 'plan_name description monthly_price plan_type category services_included'
        }
      })
      .populate({
        path: 'current_bed_assignment_id',
        select: 'bed_id assigned_date unassigned_date status',
        populate: {
          path: 'bed_id',
          select: 'bed_number bed_type room_id',
          populate: {
            path: 'room_id',
            select: 'room_number floor room_type gender capacity'
          }
        }
      })
      .exec();
    
    if (!req) throw new NotFoundException('ServiceRequest not found');
    
    if (req.status !== ServiceRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể duyệt yêu cầu đang chờ xử lý');
    }
    
    // Execute the requested changes based on request type
    try {
      await this.executeRequestChanges(req);
      
      // Update status to approved
      req.status = ServiceRequestStatus.APPROVED;
      await req.save();
      
      // Send notification email to family
      await this.sendApprovalNotification(req);
      
      return req;
    } catch (error) {
      console.error('Error executing request changes:', error);
      throw new BadRequestException('Không thể thực hiện thay đổi: ' + error.message);
    }
  }

  private async executeRequestChanges(request: ServiceRequest): Promise<void> {
    // resident_id might be populated; normalize to ObjectId
    const residentId = this.toObjectId(request.resident_id);
    
    switch (request.request_type) {
      case ServiceRequestType.CARE_PLAN_CHANGE:
        await this.executeCarePlanChange(request);
        break;
      case ServiceRequestType.SERVICE_DATE_CHANGE:
        await this.executeServiceDateChange(request);
        break;
      case ServiceRequestType.ROOM_CHANGE:
        await this.executeRoomChange(request);
        break;
      default:
        throw new BadRequestException('Loại yêu cầu không hợp lệ');
    }
  }

  private async executeCarePlanChange(request: ServiceRequest): Promise<void> {
    const residentId = this.toObjectId(request.resident_id);
    const targetCarePlanAssignmentId = this.toObjectId(request.target_care_plan_assignment_id);
    const targetBedAssignmentId = this.toObjectId(request.target_bed_assignment_id);
    
    // 1. End current active care plan and bed assignments (set to "done" at end of current month)
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0); // Last day of current month
    endOfMonth.setHours(23, 59, 59, 999);
    
    // Update current care plan assignment to "done"
    await this.carePlanAssignmentModel.updateMany(
      { 
        resident_id: residentId,
        status: 'active'
      },
      { 
        status: 'done',
        end_date: endOfMonth,
        updated_at: new Date()
      }
    );

    // Update current bed assignment to "done"
    await this.bedAssignmentModel.updateMany(
      { 
      resident_id: residentId,
        status: 'active'
      },
      { 
        status: 'done',
        unassigned_date: endOfMonth,
      updated_at: new Date()
      }
    );

    // 2. Update target care plan assignment from pending to accepted
    await this.carePlanAssignmentModel.findByIdAndUpdate(
      targetCarePlanAssignmentId,
      { 
        status: 'accepted',
        start_date: new Date(endOfMonth.getTime() + 1), // Start of next month
        updated_at: new Date()
      }
    );

    // 3. Update target bed assignment from pending to accepted
    await this.bedAssignmentModel.findByIdAndUpdate(
      targetBedAssignmentId,
      { 
        status: 'accepted',
        assigned_date: new Date(endOfMonth.getTime() + 1), // Start of next month
        updated_at: new Date()
      }
    );
  }

  private async executeServiceDateChange(request: ServiceRequest): Promise<void> {
    const residentId = this.toObjectId(request.resident_id);
    const carePlanAssignmentId = this.toObjectId(request.current_care_plan_assignment_id);
    const bedAssignmentId = this.toObjectId(request.current_bed_assignment_id);
    const newEndDate = request.new_end_date;

    // 1. Update the care plan assignment end date and reactivate if needed
    await this.carePlanAssignmentModel.findByIdAndUpdate(
      carePlanAssignmentId,
      { 
        end_date: newEndDate,
        status: 'active', // Reactivate care plan assignment (supports 5-day extension grace period)
        updated_at: new Date()
      }
    );

    // 2. Update specific bed assignment and reactivate if needed
    await this.bedAssignmentModel.findByIdAndUpdate(
      bedAssignmentId,
      { 
        unassigned_date: newEndDate,
        status: 'active', // Reactivate bed assignment (supports 5-day extension grace period)
        updated_at: new Date()
      }
    );

    // 3. Also update any other active bed assignments for this resident (fallback)
    await this.bedAssignmentModel.updateMany(
      { 
        resident_id: residentId,
        status: 'active',
        _id: { $ne: bedAssignmentId } // Exclude the one we just updated
      },
      { 
        unassigned_date: newEndDate,
        updated_at: new Date()
      }
    );
  }

  private async executeRoomChange(request: ServiceRequest): Promise<void> {
    const residentId = this.toObjectId(request.resident_id);
    const targetBedAssignmentId = this.toObjectId(request.target_bed_assignment_id);
    
    // 1. Update current bed assignment to "exchanged"
      await this.bedAssignmentModel.updateMany(
        { 
          resident_id: residentId,
        status: 'active'
        },
        { 
        status: 'exchanged',
          unassigned_date: new Date(),
          updated_at: new Date()
        }
      );

    // 2. Update target bed assignment from pending to active
    await this.bedAssignmentModel.findByIdAndUpdate(
      targetBedAssignmentId,
      { 
        status: 'active',
        assigned_date: new Date(),
        updated_at: new Date()
      }
    );
  }

  private async sendApprovalNotification(request: ServiceRequest): Promise<void> {
    try {
      const familyMember = request.family_member_id as any;
      const resident = request.resident_id as any;
      
      if (familyMember && familyMember.email) {
        const requestTypeNames = {
          'care_plan_change': 'thay đổi gói chăm sóc',
          'service_date_change': 'thay đổi thời gian dịch vụ',
          'room_change': 'đổi phòng'
        };

        await this.mailService.sendRequestApprovalEmail({
          to: familyMember.email,
          familyName: familyMember.full_name,
          residentName: resident.full_name,
          requestType: requestTypeNames[request.request_type],
          note: request.note || ''
        });
      }
    } catch (error) {
      console.error('Error sending approval notification:', error);
      // Don't throw error to avoid breaking the approval process
    }
  }

  async reject(id: string, reason?: string): Promise<ServiceRequest> {
    const req = await this.serviceRequestModel.findById(id).exec();
    if (!req) throw new NotFoundException('ServiceRequest not found');
    
    if (req.status !== ServiceRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối yêu cầu đang chờ xử lý');
    }

    // Update service request status
    const updateData: any = { status: ServiceRequestStatus.REJECTED };
    if (reason) {
      updateData.rejection_reason = reason;
    }
    await this.serviceRequestModel.findByIdAndUpdate((req as any)._id, updateData);

    // Update related assignments to rejected status
    await this.updateRelatedAssignmentsToRejected(req);

    return req;
  }

  private async updateRelatedAssignmentsToRejected(request: ServiceRequest): Promise<void> {
    // Update target care plan assignment to rejected
    if (request.target_care_plan_assignment_id) {
      await this.carePlanAssignmentModel.findByIdAndUpdate(
        request.target_care_plan_assignment_id,
        { 
          status: 'rejected',
          updated_at: new Date()
        }
      );
    }

    // Update target bed assignment to rejected
    if (request.target_bed_assignment_id) {
      await this.bedAssignmentModel.findByIdAndUpdate(
        request.target_bed_assignment_id,
        { 
          status: 'rejected',
          updated_at: new Date()
        }
      );
    }
  }
}
