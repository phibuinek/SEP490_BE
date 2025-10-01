import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill } from '../bills/schemas/bill.schema';
import { Resident } from '../residents/schemas/resident.schema';
import { User } from '../users/schemas/user.schema';
import { CarePlanAssignment } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment } from '../bed-assignments/schemas/bed-assignment.schema';
import { BillsService } from '../bills/bills.service';
import { MailService } from '../common/mail.service';
import * as moment from 'moment-timezone';

@Injectable()
export class MonthlyBillingService {
  private readonly logger = new Logger(MonthlyBillingService.name);

  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    @InjectModel(Resident.name) private residentModel: Model<Resident>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(CarePlanAssignment.name) private carePlanAssignmentModel: Model<CarePlanAssignment>,
    @InjectModel(BedAssignment.name) private bedAssignmentModel: Model<BedAssignment>,
    private readonly billsService: BillsService,
    private readonly mailService: MailService,
  ) {}

  // Cron job runs at 9:00 AM Vietnam time on the 1st of every month
  @Cron('0 9 1 * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async generateMonthlyBills() {
    this.logger.log('Starting monthly bill generation...');
    
    try {
      const currentMonth = moment().tz('Asia/Ho_Chi_Minh').format('MM/YYYY');
      this.logger.log(`Generating bills for month: ${currentMonth}`);

      // Get all admitted residents
      const admittedResidents = await this.residentModel
        .find({ 
          status: 'admitted',
          is_deleted: false 
        })
        .populate('family_member_id', 'email full_name')
        .exec();

      this.logger.log(`Found ${admittedResidents.length} admitted residents`);

      let successCount = 0;
      let errorCount = 0;

      for (const resident of admittedResidents) {
        try {
          // Check if bill already exists for this month
          const existingBill = await this.billModel.findOne({
            resident_id: resident._id,
            title: { $regex: currentMonth }
          });

          if (existingBill) {
            this.logger.log(`Bill already exists for resident ${resident._id} for ${currentMonth}`);
            continue;
          }

          // Generate bill for this resident
          const bill = await this.generateBillForResident(resident, currentMonth);
          
          if (bill) {
            successCount++;
            this.logger.log(`Generated bill ${bill._id} for resident ${resident._id}`);
            
            // Send email notification
            await this.sendBillNotificationEmail(resident, bill);
          }
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to generate bill for resident ${resident._id}:`, error);
        }
      }

      this.logger.log(`Monthly bill generation completed. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      this.logger.error('Monthly bill generation failed:', error);
    }
  }

  private async generateBillForResident(resident: any, month: string) {
    try {
      // Get current active care plan assignment
      const carePlanAssignment = await this.carePlanAssignmentModel
        .findOne({
          resident_id: resident._id,
          status: 'active'
        })
        .populate('care_plan_ids')
        .exec();

      if (!carePlanAssignment) {
        this.logger.warn(`No active care plan assignment found for resident ${resident._id}`);
        return null;
      }

      // Check if current date is within care plan assignment date range
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const startDate = moment(carePlanAssignment.start_date).tz('Asia/Ho_Chi_Minh');
      const endDate = moment(carePlanAssignment.end_date).tz('Asia/Ho_Chi_Minh');

      if (now.isBefore(startDate) || now.isAfter(endDate)) {
        this.logger.warn(`Current date is outside care plan assignment date range for resident ${resident._id}. Start: ${startDate.format('YYYY-MM-DD')}, End: ${endDate.format('YYYY-MM-DD')}, Now: ${now.format('YYYY-MM-DD')}`);
        return null;
      }

      // Get bed assignment for room cost calculation
      const bedAssignment = await this.bedAssignmentModel
        .findOne({
          resident_id: resident._id,
          status: 'active'
        })
        .populate({
          path: 'bed_id',
          populate: {
            path: 'room_id',
            populate: {
              path: 'room_type_id'
            }
          }
        })
        .exec();

      // Calculate detailed costs using existing service
      const calculation = await this.billsService.calculateTotalAmountForResident(resident._id.toString());
      
      if (!calculation) {
        this.logger.warn(`Could not calculate detailed costs for resident ${resident._id}`);
        return null;
      }

      // Use total_monthly_cost from care plan assignment as final amount
      const amount = carePlanAssignment.total_monthly_cost || calculation.totalAmount;
      
      if (amount <= 0) {
        this.logger.warn(`Invalid total_monthly_cost for resident ${resident._id}: ${amount}`);
        return null;
      }

      // Create due date (5th of current month at 23:59 Vietnam time)
      const dueDate = moment().tz('Asia/Ho_Chi_Minh').date(5).hour(23).minute(59).second(59).toDate();

      // Format month as MM/YYYY
      const monthFormatted = moment().tz('Asia/Ho_Chi_Minh').format('MM/YYYY');

      // Prepare room details
      const roomDetails = bedAssignment?.bed_id && (bedAssignment.bed_id as any)?.room_id ? {
        room_number: (bedAssignment.bed_id as any).room_id.room_number,
        room_type: (bedAssignment.bed_id as any).room_id.room_type,
        floor: (bedAssignment.bed_id as any).room_id.floor,
        monthly_price: calculation.roomDetails?.monthly_price || 0
      } : null;

      // Create bill
      const billData = {
        family_member_id: resident.family_member_id,
        resident_id: resident._id,
        care_plan_assignment_id: carePlanAssignment._id,
        bed_assignment_id: bedAssignment?._id,
        staff_id: resident.family_member_id, // Using family member as staff_id for now
        amount: amount,
        due_date: dueDate,
        payment_method: 'qr_payment',
        status: 'pending',
        title: `Hóa đơn thanh toán tháng ${monthFormatted}`,
        notes: `Hóa đơn dịch vụ chăm sóc tháng ${monthFormatted} - ${resident.full_name}`,
        billing_details: {
          resident_name: resident.full_name,
          total_service_cost: calculation.totalServiceCost,
          total_room_cost: calculation.totalRoomCost,
          service_details: calculation.serviceDetails || [],
          room_details: roomDetails
        },
        care_plan_snapshot: carePlanAssignment.care_plan_ids && carePlanAssignment.care_plan_ids.length > 0 ? {
          plan_name: (carePlanAssignment.care_plan_ids as any)[0]?.plan_name || 'Gói dịch vụ',
          description: (carePlanAssignment.care_plan_ids as any)[0]?.description || 'Dịch vụ chăm sóc',
          monthly_price: (carePlanAssignment.care_plan_ids as any)[0]?.monthly_price || 0,
          plan_type: (carePlanAssignment.care_plan_ids as any)[0]?.plan_type || 'basic',
          category: (carePlanAssignment.care_plan_ids as any)[0]?.category || 'care',
          staff_ratio: (carePlanAssignment.care_plan_ids as any)[0]?.staff_ratio || '1:1'
        } : null
      };

      const bill = new this.billModel(billData);
      return await bill.save();
    } catch (error) {
      this.logger.error(`Error generating bill for resident ${resident._id}:`, error);
      return null;
    }
  }

  private async sendBillNotificationEmail(resident: any, bill: any) {
    try {
      const familyMember = resident.family_member_id;
      if (!familyMember?.email) {
        this.logger.warn(`No email found for family member of resident ${resident._id}`);
        return;
      }

      const month = moment().tz('Asia/Ho_Chi_Minh').format('MM/YYYY');
      const dueDate = moment(bill.due_date).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
      const amount = bill.amount.toLocaleString('vi-VN');

      await this.mailService.sendMonthlyBillEmail({
        to: familyMember.email,
        familyName: familyMember.full_name,
        residentName: resident.full_name,
        month: month,
        amount: amount,
        dueDate: dueDate,
        billId: bill._id.toString()
      });

      this.logger.log(`Bill notification email sent to ${familyMember.email} for resident ${resident.full_name}`);
    } catch (error) {
      this.logger.error(`Failed to send bill notification email for resident ${resident._id}:`, error);
    }
  }

  // Manual trigger for testing
  async generateBillsManually() {
    this.logger.log('Manual bill generation triggered');
    await this.generateMonthlyBills();
  }
}


