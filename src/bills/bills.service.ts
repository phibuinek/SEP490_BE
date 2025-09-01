import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from './schemas/bill.schema';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CarePlansService } from '../care-plans/care-plans.service';
import { Types } from 'mongoose';
import { ResidentsService } from '../residents/residents.service';
import { CarePlanAssignmentsService } from '../care-plan-assignments/care-plan-assignments.service';
import { BedAssignmentsService } from '../bed-assignments/bed-assignments.service';
import { RoomTypesService } from '../room_types/room-types.service';
import { BillStatus } from './schemas/bill.schema';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    private readonly carePlansService: CarePlansService,
    private readonly residentsService: ResidentsService,
    private readonly carePlanAssignmentsService: CarePlanAssignmentsService,
    private readonly bedAssignmentsService: BedAssignmentsService,
    private readonly roomTypesService: RoomTypesService,
  ) {}

  // Function để tính tổng tiền dịch vụ và phòng cho resident
  async calculateTotalAmountForResident(residentId: string): Promise<{
    totalServiceCost: number;
    totalRoomCost: number;
    totalAmount: number;
    serviceDetails: Array<{
      plan_name: string;
      monthly_price: number;
      description: string;
    }>;
    roomDetails: {
      room_number: string;
      room_type: string;
      floor: string;
      monthly_price: number;
    } | null;
  }> {
    try {
      let totalServiceCost = 0;
      let totalRoomCost = 0;
      const serviceDetails: Array<{
        plan_name: string;
        monthly_price: number;
        description: string;
      }> = [];

      console.log('Calculating total for resident:', residentId);

      // Validate residentId
      if (!residentId || !Types.ObjectId.isValid(residentId)) {
        throw new BadRequestException('Invalid resident ID');
      }

      // 1. Lấy tất cả care plan assignments của resident
      let carePlanAssignments;
      try {
        carePlanAssignments =
          await this.carePlanAssignmentsService.findByResident(residentId);
        console.log('Found care plan assignments:', carePlanAssignments.length);
      } catch (error) {
        console.error('Error fetching care plan assignments:', error);
        carePlanAssignments = [];
      }

      // 2. Tính tổng tiền dịch vụ từ tất cả assignments ACTIVE (chưa hết hạn)
      const now = new Date();
      for (const assignment of carePlanAssignments) {
        // Kiểm tra assignment có active và chưa hết hạn không
        const notExpired =
          !assignment?.end_date || new Date(assignment.end_date) >= now;
        const notCancelled = !['cancelled', 'completed', 'expired'].includes(
          String(assignment?.status || '').toLowerCase(),
        );
        const isActive = assignment?.status === 'active' || !assignment?.status;

        console.log(`📅 Assignment ${assignment._id}:`, {
          end_date: assignment?.end_date,
          status: assignment?.status,
          notExpired,
          notCancelled,
          isActive,
          isValid: notExpired && notCancelled && isActive,
        });

        // Chỉ tính tiền nếu assignment còn active và chưa hết hạn
        if (notExpired && notCancelled && isActive) {
          if (
            assignment.care_plan_ids &&
            Array.isArray(assignment.care_plan_ids)
          ) {
            for (const carePlanId of assignment.care_plan_ids) {
              try {
                const carePlanIdStr =
                  typeof carePlanId === 'object' && carePlanId?._id
                    ? carePlanId._id.toString()
                    : carePlanId.toString();

                const carePlan =
                  await this.carePlansService.findOne(carePlanIdStr);
                if (carePlan) {
                  totalServiceCost += carePlan.monthly_price || 0;
                  serviceDetails.push({
                    plan_name: carePlan.plan_name,
                    monthly_price: carePlan.monthly_price,
                    description: carePlan.description,
                  });
                  console.log(
                    `✅ Added care plan ${carePlan.plan_name}: ${carePlan.monthly_price}`,
                  );
                }
              } catch (error) {
                console.error('Error fetching care plan:', error);
                // Continue with other care plans
              }
            }
          }
        } else {
          console.log(
            `❌ Skipped expired/cancelled assignment ${assignment._id}`,
          );
        }
      }

      // 3. Lấy thông tin phòng và tính tiền phòng
      let bedAssignments;
      try {
        bedAssignments =
          await this.bedAssignmentsService.findByResidentId(residentId);
        console.log('Found bed assignments:', bedAssignments.length);
        console.log(
          'Bed assignments data:',
          JSON.stringify(bedAssignments, null, 2),
        );
      } catch (error) {
        console.error('Error fetching bed assignments:', error);
        bedAssignments = [];
      }

      let roomDetails: {
        room_number: string;
        room_type: string;
        floor: string;
        monthly_price: number;
      } | null = null;

      if (bedAssignments && bedAssignments.length > 0) {
        const bedAssignment = bedAssignments[0]; // Lấy assignment đầu tiên
        console.log(
          'First bed assignment:',
          JSON.stringify(bedAssignment, null, 2),
        );

        if (bedAssignment.bed_id) {
          console.log('Bed assignment has bed_id:', bedAssignment.bed_id);

          // Kiểm tra xem bed_id có được populate không
          if (
            typeof bedAssignment.bed_id === 'object' &&
            bedAssignment.bed_id !== null
          ) {
            console.log(
              'Bed_id is an object:',
              JSON.stringify(bedAssignment.bed_id, null, 2),
            );

            if (bedAssignment.bed_id.room_id) {
              const room = bedAssignment.bed_id.room_id;
              console.log('Found room in bed:', JSON.stringify(room, null, 2));

              if (room && room.room_type) {
                console.log('Room has room_type:', room.room_type);
                try {
                  // Tìm room type bằng room_type string value
                  const roomType = await this.roomTypesService.findByRoomType(
                    room.room_type,
                  );
                  console.log(
                    'Found room type:',
                    JSON.stringify(roomType, null, 2),
                  );

                  if (roomType) {
                    totalRoomCost = roomType.monthly_price || 0;
                    roomDetails = {
                      room_number: room.room_number,
                      room_type: room.room_type,
                      floor: room.floor ? room.floor.toString() : 'N/A',
                      monthly_price: roomType.monthly_price,
                    };
                    console.log('Set room cost to:', totalRoomCost);
                  } else {
                    console.log('Room type not found for:', room.room_type);
                    // Thử tìm bằng type_name nếu không tìm được bằng room_type
                    const roomTypeByName =
                      await this.roomTypesService.findByRoomType(
                        room.room_type,
                      );
                    if (roomTypeByName) {
                      totalRoomCost = roomTypeByName.monthly_price || 0;
                      roomDetails = {
                        room_number: room.room_number,
                        room_type: room.room_type,
                        floor: room.floor ? room.floor.toString() : 'N/A',
                        monthly_price: roomTypeByName.monthly_price,
                      };
                      console.log('Set room cost to (by name):', totalRoomCost);
                    }
                  }
                } catch (error) {
                  console.error('Error fetching room type:', error);
                }
              } else {
                console.log('Room or room.room_type is missing');
              }
            } else {
              console.log('No room_id found in bed');
            }
          } else {
            console.log('Bed_id is not an object or is null');
          }
        } else {
          console.log('No bed_id in bed assignment');
        }
      } else {
        console.log('No bed assignments found for resident');
      }

      const totalAmount = totalServiceCost + totalRoomCost;

      console.log('Calculation result:', {
        totalServiceCost,
        totalRoomCost,
        totalAmount,
        serviceDetailsCount: serviceDetails.length,
      });

      return {
        totalServiceCost,
        totalRoomCost,
        totalAmount,
        serviceDetails,
        roomDetails,
      };
    } catch (error) {
      console.error('Error in calculateTotalAmountForResident:', error);
      throw error;
    }
  }

  async create(createBillDto: CreateBillDto, req?: any): Promise<Bill> {
    try {
      const toVNDate = (d: Date | string | undefined) =>
        d ? new Date(new Date(d).getTime() + 7 * 60 * 60 * 1000) : undefined;

      // Validate resident_id
      if (!createBillDto.resident_id) {
        throw new BadRequestException('ID người cao tuổi là bắt buộc');
      }

      // Validate ObjectId format
      if (!Types.ObjectId.isValid(createBillDto.resident_id.toString())) {
        throw new BadRequestException(
          'Định dạng ID người cao tuổi không hợp lệ',
        );
      }

      // Check if resident exists and get family_member_id
      const resident = await this.residentsService.findOne(
        createBillDto.resident_id.toString(),
      );
      if (!resident) {
        throw new NotFoundException('Không tìm thấy thông tin người cao tuổi');
      }

      // Create bill with enhanced validation
      const billData: any = {
        ...createBillDto,
        family_member_id: resident.family_member_id,
        due_date: toVNDate(createBillDto.due_date),
        status: BillStatus.PENDING,
        payment_method: 'qr_payment',
        paid_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Add admin_id if available from request
      if (req?.user?.user_id) {
        billData.admin_id = new Types.ObjectId(req.user.user_id);
      }

      const bill = new this.billModel(billData);
      const savedBill = await bill.save();
      return savedBill;
    } catch (error) {
      console.error('Error creating bill:', error);
      if (error.name === 'MongoServerError' && error.code === 121) {
        throw new BadRequestException({
          message: 'MongoDB validation error',
          details: error.errInfo?.details || error.errmsg || error.message,
        });
      }
      throw error;
    }
  }

  async findAll(): Promise<Bill[]> {
    return this.billModel
      .find()
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select:
              'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .sort({ created_at: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Bill> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID hóa đơn không hợp lệ');
    }

    const bill = await this.billModel
      .findById(id)
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select:
              'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .exec();

    if (!bill) {
      throw new NotFoundException(`Không tìm thấy hóa đơn #${id}`);
    }

    return bill;
  }

  async update(id: string, updateBillDto: UpdateBillDto): Promise<Bill> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID hóa đơn không hợp lệ');
    }

    const bill = await this.billModel.findById(id);
    if (!bill) {
      throw new NotFoundException(`Không tìm thấy hóa đơn #${id}`);
    }

    const updatedBill = await this.billModel
      .findByIdAndUpdate(
        id,
        { ...updateBillDto, updated_at: new Date() },
        { new: true },
      )
      .populate('resident_id', 'full_name room_number')
      .populate('staff_id', 'full_name')
      .populate('family_member_id', 'full_name email')
      .exec();

    if (!updatedBill) {
      throw new NotFoundException(`Không tìm thấy hóa đơn #${id}`);
    }

    return updatedBill;
  }

  async remove(id: string): Promise<Bill> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID hóa đơn không hợp lệ');
    }

    const bill = await this.billModel.findByIdAndDelete(id);
    if (!bill) {
      throw new NotFoundException(`Không tìm thấy hóa đơn #${id}`);
    }

    return bill;
  }

  async findByResidentId(resident_id: string): Promise<Bill[]> {
    if (!Types.ObjectId.isValid(resident_id)) {
      throw new BadRequestException('Invalid resident ID format');
    }

    return this.billModel
      .find({ resident_id: new Types.ObjectId(resident_id) })
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select:
              'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .sort({ due_date: -1 })
      .exec();
  }

  async findByFamilyMemberId(family_member_id: string): Promise<Bill[]> {
    if (!Types.ObjectId.isValid(family_member_id)) {
      throw new BadRequestException('Invalid family member ID format');
    }
    return this.billModel
      .find({ family_member_id: new Types.ObjectId(family_member_id) })
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select:
              'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .sort({ due_date: -1 })
      .exec();
  }

  async findByStaffId(staffId: string): Promise<Bill[]> {
    if (!Types.ObjectId.isValid(staffId)) {
      throw new BadRequestException('Invalid staff ID format');
    }
    return this.billModel
      .find({ staff_id: new Types.ObjectId(staffId) })
      .populate('family_member_id', 'full_name email')
      .populate('resident_id', 'full_name')
      .populate('staff_id', 'full_name')
      .populate({
        path: 'care_plan_assignment_id',
        populate: [
          {
            path: 'care_plan_ids',
            model: 'CarePlan',
            select:
              'plan_name description monthly_price plan_type category services_included staff_ratio duration_type',
          },
          {
            path: 'assigned_room_id',
            model: 'Room',
            select: 'room_number room_type floor',
          },
          {
            path: 'assigned_bed_id',
            model: 'Bed',
            select: 'bed_number bed_type',
          },
        ],
      })
      .sort({ created_at: -1 })
      .exec();
  }
}
