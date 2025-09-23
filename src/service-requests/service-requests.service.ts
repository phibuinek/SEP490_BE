import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ServiceRequest,
  ServiceRequestDocument,
  ServiceRequestStatus,
} from './service-request.schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
import { Role } from '../common/enums/role.enum';
import { CarePlanAssignment } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentDocument } from '../bed-assignments/schemas/bed-assignment.schema';
import { MailService } from '../common/mail.service';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectModel(ServiceRequest.name)
    private serviceRequestModel: Model<ServiceRequestDocument>,
    @InjectModel(Resident.name)
    private residentModel: Model<ResidentDocument>,
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<any>,
    @InjectModel(BedAssignment.name)
    private bedAssignmentModel: Model<BedAssignmentDocument>,
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

    // Normalize payload by request_type
    const payload: any = {
      resident_id: new Types.ObjectId(dto.resident_id),
      family_member_id: new Types.ObjectId(user.userId),
      request_type: dto.request_type,
      note: dto.note || undefined,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      medicalNote: dto.medicalNote || undefined,
      status: ServiceRequestStatus.PENDING,
    };

    if (dto.request_type === 'care_plan_change') {
      if (!dto.target_service_package_id) {
        throw new BadRequestException('Thiếu target_service_package_id');
      }
      payload.target_service_package_id = new Types.ObjectId(
        dto.target_service_package_id,
      );
      // Xử lý thêm các trường cho care_plan_change
      if (dto.new_start_date) payload.new_start_date = new Date(dto.new_start_date);
      if (dto.new_end_date) payload.new_end_date = new Date(dto.new_end_date);
      if (dto.target_room_id) payload.target_room_id = new Types.ObjectId(dto.target_room_id);
      if (dto.target_bed_id) payload.target_bed_id = new Types.ObjectId(dto.target_bed_id);
    } else if (dto.request_type === 'service_date_change') {
      if (!dto.new_start_date && !dto.new_end_date) {
        throw new BadRequestException('Cần new_start_date hoặc new_end_date');
      }
      if (dto.new_start_date) payload.new_start_date = new Date(dto.new_start_date);
      if (dto.new_end_date) payload.new_end_date = new Date(dto.new_end_date);
    } else if (dto.request_type === 'room_change') {
      if (!dto.target_room_id) {
        throw new BadRequestException('Thiếu target_room_id');
      }
      payload.target_room_id = new Types.ObjectId(dto.target_room_id);
      if (dto.target_bed_id) {
        payload.target_bed_id = new Types.ObjectId(dto.target_bed_id);
      }
    }

    const created = new this.serviceRequestModel(payload);
    return created.save();
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
      case 'care_plan_change':
        await this.executeCarePlanChange(residentId, request.target_service_package_id);
        break;
      case 'service_date_change':
        await this.executeServiceDateChange(residentId, request.new_start_date || undefined, request.new_end_date || undefined);
        break;
      case 'room_change':
        await this.executeRoomChange(
          residentId,
          request.target_room_id ? this.toObjectId(request.target_room_id) : undefined,
          request.target_bed_id ? this.toObjectId(request.target_bed_id) : undefined,
        );
        break;
      default:
        throw new BadRequestException('Loại yêu cầu không hợp lệ');
    }
  }

  private async executeCarePlanChange(residentId: any, newServicePackageId: any): Promise<void> {
    // End current care plan assignment
    await this.carePlanAssignmentModel.updateMany(
      { 
        resident_id: residentId,
        end_date: null // Only active assignments
      },
      { 
        end_date: new Date(),
        updated_at: new Date()
      }
    );

    // Create new care plan assignment
    const newAssignment = new this.carePlanAssignmentModel({
      resident_id: residentId,
      care_plan_id: newServicePackageId,
      start_date: new Date(),
      end_date: null,
      assigned_by: null, // System assigned
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    await newAssignment.save();
  }

  private async executeServiceDateChange(residentId: any, newStartDate?: Date, newEndDate?: Date): Promise<void> {
    const updateData: any = { updated_at: new Date() };
    
    if (newStartDate) {
      updateData.start_date = newStartDate;
    }
    
    if (newEndDate) {
      updateData.end_date = newEndDate;
    }

    await this.carePlanAssignmentModel.updateMany(
      { 
        resident_id: residentId,
        end_date: null // Only active assignments
      },
      updateData
    );
  }

  private async executeRoomChange(residentId: any, newRoomId: any, targetBedId?: any): Promise<void> {
    try {
      // End current bed assignment
      await this.bedAssignmentModel.updateMany(
        { 
          resident_id: residentId,
          unassigned_date: null // Only active assignments
        },
        { 
          unassigned_date: new Date(),
          updated_at: new Date()
        }
      );

      let bedIdToAssign;

      if (targetBedId) {
        // Use the specific bed requested
        bedIdToAssign = targetBedId;
        
        // Verify the bed exists and is in the correct room
        const bed = await this.bedAssignmentModel.db.collection('beds').findOne({ _id: new Types.ObjectId(targetBedId) });
        if (!bed) {
          throw new BadRequestException('Giường được yêu cầu không tồn tại');
        }
        
        // Check if bed is already assigned
        const existingAssignment = await this.bedAssignmentModel.findOne({
          bed_id: targetBedId,
          unassigned_date: null
        });
        
        if (existingAssignment) {
          throw new BadRequestException('Giường được yêu cầu đã được sử dụng');
        }
      } else {
        // Find an available bed in the new room - simplified approach
        const availableBeds = await this.bedAssignmentModel.db.collection('beds').find({
          room_id: new Types.ObjectId(newRoomId)
        }).toArray();
        
        if (availableBeds.length === 0) {
          throw new BadRequestException('Phòng mới không có giường nào');
        }
        
        // Find first unassigned bed
        for (const bed of availableBeds) {
          const existingAssignment = await this.bedAssignmentModel.findOne({
            bed_id: bed._id,
            unassigned_date: null
          });
          
          if (!existingAssignment) {
            bedIdToAssign = bed._id;
            break;
          }
        }
        
        if (!bedIdToAssign) {
          throw new BadRequestException('Không có giường trống trong phòng mới');
        }
      }

      // Create new bed assignment
      const newBedAssignment = new this.bedAssignmentModel({
        resident_id: residentId,
        bed_id: bedIdToAssign,
        assigned_date: new Date(),
        unassigned_date: null,
        status: 'active', // Required field
        assigned_by: new Types.ObjectId('000000000000000000000000'), // System assigned - use a default system user ID
        reason: 'Room change request approved'
      });

      await newBedAssignment.save();
    } catch (error) {
      console.error('Error in executeRoomChange:', error);
      throw error;
    }
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
          note: request.note
        });
      }
    } catch (error) {
      console.error('Error sending approval notification:', error);
      // Don't throw error to avoid breaking the approval process
    }
  }

  async reject(id: string, reason?: string): Promise<ServiceRequest> {
    const updateData: any = { status: ServiceRequestStatus.REJECTED };
    if (reason) {
      updateData.rejection_reason = reason;
    }
    
    const req = await this.serviceRequestModel
      .findByIdAndUpdate(
        id,
        updateData,
        { new: true },
      )
      .exec();
    if (!req) throw new NotFoundException('ServiceRequest not found');
    return req;
  }
}
