import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto-js';
import * as moment from 'moment';
import { CarePlansService } from 'src/care-plans/care-plans.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from '../bills/schemas/bill.schema';
import { Payment } from './schemas/payment.schema';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private readonly clientId = 'd89d5297-4ff5-4f10-9d44-c8dd3f68f71b';
  private readonly apiKey = '79bc8e19-0dc0-4111-95ff-69bf4687858e';
  private readonly checksumKey =
    '0ecbdbfa3f52b73dacdd2790501563fccca43d92e039e37aef14ffca2850d147';
  private readonly payosUrl =
    'https://api-merchant.payos.vn/v2/payment-requests';
  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
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
    
    // URL cho từng platform
    const returnUrl = platform === 'mobile' 
      ? `nhms://payment/success?billId=${bill._id}&orderCode=${orderCode}` 
      : 'http://localhost:3000/payment/success';
    const cancelUrl = platform === 'mobile' 
      ? `nhms://payment/cancel?billId=${bill._id}&orderCode=${orderCode}` 
      : 'http://localhost:3000/payment/cancel';
    
    const data = {
      orderCode,
      amount,
      description,
      returnUrl,
      cancelUrl,
      expiredAt: moment().add(15, 'minutes').unix(),
      signature: this.generateSignature(amount, orderCode, description, returnUrl, cancelUrl),
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
        payment_link_id: response.data?.data?.paymentLinkId || response.data?.paymentLinkId || response.data?.payment_link_id,
        platform: platform // Lưu platform để xử lý webhook
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
    console.log('Webhook data:', JSON.stringify(data, null, 2));
    const payload = data.data || data;

    // Xử lý test data từ PayOS
    if (payload.test || data.test) {
      console.log('Received test webhook data');
      return { message: 'Test webhook received successfully', status: 'test' };
    }

    let bill = null;
    if (payload.paymentLinkId) {
      bill = await this.billModel.findOne({ payment_link_id: payload.paymentLinkId });
    }
    if (!bill && payload.orderCode) {
      bill = await this.billModel.findOne({ order_code: payload.orderCode });
    }
    if (!bill) {
      console.error('Cannot find bill by paymentLinkId or orderCode');
      console.error('Available data:', { paymentLinkId: payload.paymentLinkId, orderCode: payload.orderCode });
      
      // Thay vì throw error, return success để PayOS không retry
      return { 
        message: 'Bill not found, but webhook received successfully', 
        status: 'bill_not_found',
        data: { paymentLinkId: payload.paymentLinkId, orderCode: payload.orderCode }
      };
    }
    const billId = String((bill as any)._id);

    let newStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
    if (data.status === 'PAID' || payload.status === 'PAID' || data.code === '00') newStatus = 'paid';

    await this.billModel.findByIdAndUpdate(
      billId,
      { status: newStatus, paid_date: new Date() },
      { new: true }
    );

    if (payload.amount && payload.payment_method && payload.reference) {
      const existing = await this.paymentModel.findOne({ transaction_id: payload.reference });
      if (!existing) {
        await this.paymentModel.create({
          bill_id: billId,
          amount: payload.amount,
          payment_method: payload.payment_method,
          transaction_id: payload.reference,
          status: newStatus,
        });
      }
    }
    return { message: 'Webhook processed', status: newStatus };
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
          payment_link_id: bill.payment_link_id
        },
        message: 'Kiểm tra trạng thái thanh toán thành công'
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new BadRequestException('Không thể kiểm tra trạng thái thanh toán');
    }
  }
}