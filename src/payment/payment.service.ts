import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto-js';
import * as moment from 'moment';
import { CarePlansService } from '../care-plans/care-plans.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from '../bills/schemas/bill.schema';
import { Payment } from './schemas/payment.schema';
import { BadRequestException } from '@nestjs/common';
import { CarePlanAssignment } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment } from '../bed-assignments/schemas/bed-assignment.schema';
import { Resident } from '../residents/schemas/resident.schema';

@Injectable()
export class PaymentService {
  private readonly payosUrl =
    'https://api-merchant.payos.vn/v2/payment-requests';
  private readonly clientId = 'd89d5297-4ff5-4f10-9d44-c8dd3f68f71b';
  private readonly apiKey = '79bc8e19-0dc0-4111-95ff-69bf4687858e';
  private readonly checksumKey =
    '0ecbdbfa3f52b73dacdd2790501563fccca43d92e039e37aef14ffca2850d147';
  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(CarePlanAssignment.name) private carePlanAssignmentModel: Model<CarePlanAssignment>,
    @InjectModel(BedAssignment.name) private bedAssignmentModel: Model<BedAssignment>,
    @InjectModel(Resident.name) private residentModel: Model<Resident>,
    private readonly careplanService: CarePlansService,
  ) {}

  async createPaymentLink(createPaymentDto: CreatePaymentDto) {
    const bill = await this.billModel.findById(createPaymentDto.bill_id).exec();
    if (!bill) throw new Error('Bill không tồn tại');
    const amount = bill.amount;
    const orderCode = this.generateOrderCode();
    const rawDescription = `Thanh toán hóa đơn: ${bill._id}`;
    const description = rawDescription.slice(0, 25);

    // Xác định platform từ request (web hoặc mobile)
    const platform = createPaymentDto.platform || 'web'; // default là web

    // URL cho từng platform - Sử dụng URL thực tế thay vì deep link
    const returnUrl =
      platform === 'mobile' || platform === 'webview'
        ? `https://payos.vn/payment/success?billId=${bill._id}&orderCode=${orderCode}`
        : 'https://carehome-system.vercel.app/payment/success';
    const cancelUrl =
      platform === 'mobile' || platform === 'webview'
        ? `https://payos.vn/payment/cancel?billId=${bill._id}&orderCode=${orderCode}`
        : 'https://carehome-system.vercel.app/payment/cancel';

    const data = {
      orderCode,
      amount,
      description,

      returnUrl,
      cancelUrl,

      expiredAt: moment().add(15, 'minutes').unix(),
      signature: this.generateSignature(
        amount,
        orderCode,
        description,
        returnUrl,
        cancelUrl,
      ),
    };
    const headers = {
      'x-client-id': this.clientId,
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
    try {
      const response = await axios.post(this.payosUrl, data, { headers });

      await this.billModel.findByIdAndUpdate(bill._id, {
        order_code: orderCode,
        payment_link_id:
          response.data?.data?.paymentLinkId ||
          response.data?.paymentLinkId ||
          response.data?.payment_link_id,
        platform: platform, // Lưu platform để xử lý webhook
      });
      return response.data;
    } catch (error) {
      console.error(
        'Error creating payment link:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to create payment link');
    }
  }

  private generateOrderCode(): number {
    return parseInt(moment().format('YYMMDDHHmmss'));
  }

  private generateSignature(
    amount: number,
    orderCode: number,
    description: string,
    returnUrl: string,
    cancelUrl: string,
  ): string {
    const data = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;

    return crypto.HmacSHA256(data, this.checksumKey).toString(crypto.enc.Hex);
  }

  async handlePaymentWebhook(data: any) {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Raw webhook data:', JSON.stringify(data, null, 2));

    const payload = data.data || data;
    console.log('Processed payload:', JSON.stringify(payload, null, 2));

    // Xử lý test data từ PayOS
    if (payload.test || data.test) {
      console.log('Received test webhook data');
      return { message: 'Test webhook received successfully', status: 'test' };
    }

    // Tìm bill theo nhiều cách
    let bill = null;
    let searchMethod = '';

    console.log('🔍 Searching for bill with:');
    console.log('- paymentLinkId:', payload.paymentLinkId);
    console.log('- orderCode:', payload.orderCode);
    console.log('- data.orderCode:', data.orderCode);

    // 1. Tìm theo paymentLinkId
    if (payload.paymentLinkId) {
      bill = await this.billModel.findOne({
        payment_link_id: payload.paymentLinkId,
      });
      searchMethod = 'paymentLinkId';
      console.log(
        '🔍 Search by paymentLinkId:',
        payload.paymentLinkId,
        bill ? 'Found' : 'Not found',
      );
    }

    // 2. Tìm theo orderCode
    if (!bill && payload.orderCode) {
      bill = await this.billModel.findOne({ order_code: payload.orderCode });
      searchMethod = 'orderCode';
      console.log(
        '🔍 Search by orderCode:',
        payload.orderCode,
        bill ? 'Found' : 'Not found',
      );
    }

    // 3. Tìm theo orderCode trong data gốc
    if (!bill && data.orderCode) {
      bill = await this.billModel.findOne({ order_code: data.orderCode });
      searchMethod = 'data.orderCode';
      console.log(
        '🔍 Search by data.orderCode:',
        data.orderCode,
        bill ? 'Found' : 'Not found',
      );
    }

    if (!bill) {
      console.error('❌ Cannot find bill!');
      console.error('Search methods tried:', searchMethod);
      console.error('Available data:', {
        paymentLinkId: payload.paymentLinkId,
        orderCode: payload.orderCode,
        dataOrderCode: data.orderCode,
      });

      // Log tất cả bills để debug
      const allBills = await this.billModel
        .find({}, 'order_code payment_link_id _id')
        .limit(10);
      console.error('Recent bills in DB:', allBills);

      return {
        message: 'Bill not found, but webhook received successfully',
        status: 'bill_not_found',
        data: {
          paymentLinkId: payload.paymentLinkId,
          orderCode: payload.orderCode,
        },
      };
    }

    console.log('✅ Bill found:', {
      billId: (bill as any)._id,
      orderCode: (bill as any).order_code,
      paymentLinkId: (bill as any).payment_link_id,
      currentStatus: (bill as any).status,
    });

    const billId = String((bill as any)._id);

    // Xác định trạng thái mới
    let newStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
    const statusIndicators = [
      data.status,
      payload.status,
      data.code,
      payload.code,
      data.paymentStatus,
      payload.paymentStatus,
    ];

    console.log('Status indicators:', statusIndicators);

    if (
      statusIndicators.some(
        (status) =>
          status === 'PAID' ||
          status === 'paid' ||
          status === '00' ||
          status === 0,
      )
    ) {
      newStatus = 'paid';
    }

    console.log('🔄 Updating bill status:', {
      from: (bill as any).status,
      to: newStatus,
    });

    // Cập nhật bill sử dụng method riêng
    const updatedBill = await this.updateBillStatus(billId, newStatus);

    // Tạo payment record nếu có thông tin
    if (payload.amount || data.amount) {
      const paymentData = {
        bill_id: billId,
        amount: payload.amount || data.amount,
        payment_method: 'qr_payment', // Luôn sử dụng qr_payment cho PayOS
        transaction_id:
          payload.reference ||
          payload.transaction_id ||
          data.reference ||
          data.transaction_id ||
          `PAY_${Date.now()}`,
        status: newStatus,
      };

      const existing = await this.paymentModel.findOne({
        transaction_id: paymentData.transaction_id,
      });
      if (!existing) {
        const payment = await this.paymentModel.create(paymentData);
        console.log('✅ Payment record created:', payment._id);
      } else {
        console.log('ℹ️ Payment record already exists');
      }
    }

    console.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===');
    return {
      message: 'Webhook processed successfully',
      status: newStatus,
      billId: billId,
    };
  }

  // Method riêng để update bill status
  async updateBillStatus(
    billId: string,
    status: 'pending' | 'paid' | 'overdue' | 'cancelled',
    paidDate?: Date,
  ) {
    try {
      const updateData: any = { status };

      // Chỉ update paid_date khi status = 'paid'
      if (status === 'paid') {
        updateData.paid_date = paidDate || new Date();
      } else if (status === 'pending') {
        updateData.paid_date = null; // Reset paid_date khi chuyển về pending
      }

      const updatedBill = await this.billModel.findByIdAndUpdate(
        billId,
        updateData,
        { new: true },
      );

      if (!updatedBill) {
        throw new Error(`Bill with ID ${billId} not found`);
      }

      console.log('✅ Bill status updated successfully:', {
        billId: updatedBill._id,
        newStatus: updatedBill.status,
        paidDate: updatedBill.paid_date,
      });

      // Khi payment thành công, cập nhật status của các entities liên quan
      if (status === 'paid') {
        await this.updateRelatedEntitiesStatus(updatedBill);
      }

      return updatedBill;
    } catch (error) {
      console.error('❌ Error updating bill status:', error);
      throw error;
    }
  }

  /**
   * Cập nhật status của các entities liên quan khi payment thành công
   * - Care plan assignment → 'completed'
   * - Bed assignment → 'completed' 
   * - Resident → 'active'
   */
  private async updateRelatedEntitiesStatus(bill: any) {
    try {
      console.log('🔄 Updating related entities status after payment completion...');

      const updatePromises: Promise<any>[] = [];

      // Cập nhật Care Plan Assignment status thành 'completed'
      if (bill.care_plan_assignment_id) {
        console.log('📋 Updating care plan assignment status to completed:', bill.care_plan_assignment_id);
        updatePromises.push(
          this.carePlanAssignmentModel.findByIdAndUpdate(
            bill.care_plan_assignment_id,
            { 
              status: 'completed',
              updated_at: new Date()
            },
            { new: true }
          ).exec()
        );
      }

      // Cập nhật Bed Assignment status thành 'completed'
      if (bill.bed_assignment_id) {
        console.log('🛏️ Updating bed assignment status to completed:', bill.bed_assignment_id);
        updatePromises.push(
          this.bedAssignmentModel.findByIdAndUpdate(
            bill.bed_assignment_id,
            { 
              status: 'completed',
              updated_at: new Date()
            },
            { new: true }
          ).exec()
        );
      }

      // Cập nhật Resident status thành 'active'
      if (bill.resident_id) {
        console.log('👤 Updating resident status to active:', bill.resident_id);
        updatePromises.push(
          this.residentModel.findByIdAndUpdate(
            bill.resident_id,
            { 
              status: 'active',
              updated_at: new Date()
            },
            { new: true }
          ).exec()
        );
      }

      // Thực hiện tất cả các cập nhật song song
      const results = await Promise.allSettled(updatePromises);
      
      // Log kết quả
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ Entity ${index + 1} updated successfully`);
        } else {
          console.error(`❌ Entity ${index + 1} update failed:`, result.reason);
        }
      });

      console.log('✅ All related entities status updated successfully');
    } catch (error) {
      console.error('❌ Error updating related entities status:', error);
      // Không throw error để không ảnh hưởng đến payment process
    }
  }

  async checkPaymentStatus(billId: string) {
    try {
      const bill = await this.billModel.findById(billId).exec();
      if (!bill) {
        throw new BadRequestException('Bill không tồn tại');
      }

      return {
        success: true,
        data: {
          bill_id: bill._id,
          status: bill.status,
          amount: bill.amount,
          paid_date: bill.paid_date,
          order_code: bill.order_code,
          payment_link_id: bill.payment_link_id,
        },
        message: 'Kiểm tra trạng thái thanh toán thành công',
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new BadRequestException('Không thể kiểm tra trạng thái thanh toán');
    }
  }

  async getPaymentStats() {
    try {
      // Lấy thống kê từ bills
      const totalBills = await this.billModel.countDocuments();
      const paidBills = await this.billModel.countDocuments({ status: 'paid' });
      const pendingBills = await this.billModel.countDocuments({
        status: 'pending',
      });
      const overdueBills = await this.billModel.countDocuments({
        status: 'overdue',
      });

      // Tính tổng doanh thu
      const paidBillsData = await this.billModel.find({ status: 'paid' });
      const totalRevenue = paidBillsData.reduce(
        (sum, bill) => sum + bill.amount,
        0,
      );

      // Tính doanh thu tháng hiện tại
      const currentMonth = new Date();
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );

      const monthlyBills = await this.billModel.find({
        status: 'paid',
        paid_date: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      });
      const monthlyRevenue = monthlyBills.reduce(
        (sum, bill) => sum + bill.amount,
        0,
      );

      // Tính doanh thu tháng trước để so sánh
      const lastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        0,
      );

      const lastMonthBills = await this.billModel.find({
        status: 'paid',
        paid_date: {
          $gte: lastMonth,
          $lte: endOfLastMonth,
        },
      });
      const lastMonthRevenue = lastMonthBills.reduce(
        (sum, bill) => sum + bill.amount,
        0,
      );

      // Tính phần trăm tăng trưởng
      const growthPercentage =
        lastMonthRevenue > 0
          ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      return {
        success: true,
        data: {
          totalBills,
          paidBills,
          pendingBills,
          overdueBills,
          totalRevenue,
          monthlyRevenue,
          lastMonthRevenue,
          growthPercentage: Math.round(growthPercentage * 100) / 100,
          pendingPayments: pendingBills + overdueBills,
        },
        message: 'Thống kê thanh toán được lấy thành công',
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw new BadRequestException('Không thể lấy thống kê thanh toán');
    }
  }
}
