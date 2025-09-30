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

    // Validate required fields for SERVICE_DATE_CHANGE
    if (dto.request_type === ServiceRequestType.SERVICE_DATE_CHANGE) {
      if (!dto.current_care_plan_assignment_id) {
        throw new BadRequestException('Thiếu current_care_plan_assignment_id');
      }
      if (!dto.new_end_date) {
        throw new BadRequestException('Thiếu new_end_date');
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
    // This would typically involve creating new care plan and bed assignments
    // For now, we'll create a basic request structure
    const payload = {
      resident_id: new Types.ObjectId(dto.resident_id),
      family_member_id: new Types.ObjectId(familyMemberId),
      request_type: ServiceRequestType.CARE_PLAN_CHANGE,
      note: dto.note,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      medicalNote: dto.medicalNote,
      status: ServiceRequestStatus.PENDING,
      // These will be populated when admin approves
      target_care_plan_assignment_id: null,
      target_bed_assignment_id: null,
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
      new_end_date: new Date(dto.new_end_date!),
    };

    return new this.serviceRequestModel(payload).save();
  }

  private async createRoomChangeRequest(dto: CreateServiceRequestDto, familyMemberId: string): Promise<ServiceRequest> {
    // This would typically involve creating a new bed assignment
    // For now, we'll create a basic request structure
    const payload = {
      resident_id: new Types.ObjectId(dto.resident_id),
      family_member_id: new Types.ObjectId(familyMemberId),
      request_type: ServiceRequestType.ROOM_CHANGE,
      note: dto.note,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      medicalNote: dto.medicalNote,
      status: ServiceRequestStatus.PENDING,
      // This will be populated when admin approves
      target_bed_assignment_id: null,
    };

    return new this.serviceRequestModel(payload).save();
  }

  async findAll(status?: string): Promise<ServiceRequest[]> {
    const filter = status ? { status } : {};
    return this.serviceRequestModel
      .find(filter)
      .populate('resident_id', 'full_name email phone cccd_id')
      .populate('family_member_id', 'full_name email phone')
      .populate('target_room_id', 'room_number floor room_type gender')
      .populate('target_bed_id', 'bed_number bed_type')
      .exec();
  }

  async findAllByFamily(familyMemberId: string): Promise<ServiceRequest[]> {
    if (!Types.ObjectId.isValid(familyMemberId)) {
      throw new BadRequestException('familyMemberId không hợp lệ');
    }
    return this.serviceRequestModel
      .find({ family_member_id: new Types.ObjectId(familyMemberId) })
      .exec();
  }

  async approve(id: string): Promise<ServiceRequest> {
    const req = await this.serviceRequestModel
      .findById(id)
      .populate('resident_id', 'full_name family_member_id')
      .populate('family_member_id', 'full_name email')
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

    // 2. Create new care plan assignment (pending -> accepted -> active)
    const newCarePlanAssignment = new this.carePlanAssignmentModel({
      resident_id: residentId,
      care_plan_ids: [], // This would be populated based on the request
      start_date: new Date(endOfMonth.getTime() + 1), // Start of next month
      end_date: null,
      status: 'accepted', // Will become active at start of next month
      family_member_id: request.family_member_id,
      created_at: new Date(),
      updated_at: new Date()
    });
    await newCarePlanAssignment.save();

    // 3. Create new bed assignment (pending -> accepted -> active)
    const newBedAssignment = new this.bedAssignmentModel({
      resident_id: residentId,
      bed_id: new Types.ObjectId(), // This would be determined based on the request
      assigned_date: new Date(endOfMonth.getTime() + 1), // Start of next month
      unassigned_date: null,
      status: 'accepted', // Will become active at start of next month
      assigned_by: new Types.ObjectId(), // System assigned
      reason: 'Care plan change approved'
    });
    await newBedAssignment.save();

    // 4. Update service request with the created assignments
    await this.serviceRequestModel.findByIdAndUpdate((request as any)._id, {
      target_care_plan_assignment_id: newCarePlanAssignment._id,
      target_bed_assignment_id: newBedAssignment._id
    });
  }

  private async executeServiceDateChange(request: ServiceRequest): Promise<void> {
    const carePlanAssignmentId = this.toObjectId(request.current_care_plan_assignment_id);
    const newEndDate = request.new_end_date;

    // Update the care plan assignment end date
    await this.carePlanAssignmentModel.findByIdAndUpdate(
      carePlanAssignmentId,
      { 
        end_date: newEndDate,
        updated_at: new Date()
      }
    );
  }

  private async executeRoomChange(request: ServiceRequest): Promise<void> {
    const residentId = this.toObjectId(request.resident_id);
    
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

    // 2. Create new bed assignment (pending -> accepted -> active)
    const newBedAssignment = new this.bedAssignmentModel({
      resident_id: residentId,
      bed_id: new Types.ObjectId(), // This would be determined based on the request
      assigned_date: new Date(),
      unassigned_date: null,
      status: 'active', // Immediately active for room change
      assigned_by: new Types.ObjectId(), // System assigned
      reason: 'Room change approved'
    });
    await newBedAssignment.save();

    // 3. Update service request with the created assignment
    await this.serviceRequestModel.findByIdAndUpdate((request as any)._id, {
      target_bed_assignment_id: newBedAssignment._id
    });
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
