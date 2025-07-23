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
    // Lấy bill theo bill_id
    const bill = await this.billModel.findById(createPaymentDto.bill_id).exec();
    if (!bill) throw new Error('Bill không tồn tại');
    // Nếu cần lấy thông tin care plan, hãy lấy từ assignment hoặc chỉ dùng bill.amount
    const amount = bill.amount;
    const orderCode = this.generateOrderCode();
    const rawDescription = `Thanh toán hóa đơn: ${bill._id}`;
    const description = rawDescription.slice(0, 25); // PayOS chỉ cho phép tối đa 25 ký tự
    const data = {
      orderCode,
      amount,
      description,
      returnUrl: 'http://localhost:8000/payment/success',
      cancelUrl: 'http://localhost:8000/payment/cancel',
      expiredAt: moment().add(15, 'minutes').unix(),
      signature: this.generateSignature(amount, orderCode, description),
    };
    const headers = {
      'x-client-id': this.clientId,
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
    try {
      const response = await axios.post(this.payosUrl, data, { headers });
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
  ): string {
    const data = `amount=${amount}&cancelUrl=http://localhost:8000/payment/cancel&description=${description}&orderCode=${orderCode}&returnUrl=http://localhost:8000/payment/success`;
    return crypto.HmacSHA256(data, this.checksumKey).toString(crypto.enc.Hex);
  }

  async handlePaymentWebhook(data: any) {
    // Xác định trạng thái mới
    let newStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' = 'pending';
    if (data.status === 'SUCCEEDED' || data.status === 'succeeded' || data.status === 'paid') newStatus = 'paid';
    else if (data.status === 'CANCELLED' || data.status === 'cancelled') newStatus = 'cancelled';
    else if (data.status === 'OVERDUE' || data.status === 'overdue') newStatus = 'overdue';

    // Cập nhật trạng thái bill
    await this.billModel.findByIdAndUpdate(
      data.bill_id,
      { status: newStatus },
      { new: true }
    );

    // Lưu thông tin payment nếu chưa có
    const existing = await this.paymentModel.findOne({ transaction_id: data.transaction_id });
    if (!existing) {
      await this.paymentModel.create({
        bill_id: data.bill_id,
        amount: data.amount,
        payment_method: data.payment_method,
        transaction_id: data.transaction_id,
        status: newStatus,
      });
    }
    return { message: 'Webhook processed', status: newStatus };
  }
}
