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
  private readonly payosUrl = "https://api-merchant.payos.vn/v2/payment-requests";
  private readonly clientId = "124afbcf-c357-45a6-b20b-a40bc5c25238";
  private readonly apiKey = "9fe0e043-ad7d-4c8f-86f7-ce5a34512c84";
  private readonly checksumKey = "ce6ee075d1921c664a43d8eccdca84582f418a23ece423738753b3ee808aa04f";
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
    const data = {
      orderCode,
      amount,
      description,
      returnUrl: 'http://localhost:3000/payment/success',
      cancelUrl: 'http://localhost:3000/payment/cancel',
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

      await this.billModel.findByIdAndUpdate(bill._id, {
        order_code: orderCode,
        payment_link_id: response.data?.data?.paymentLinkId || response.data?.paymentLinkId || response.data?.payment_link_id
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
  ): string {
    const data = `amount=${amount}&cancelUrl=http://localhost:3000/payment/cancel&description=${description}&orderCode=${orderCode}&returnUrl=http://localhost:3000/payment/success`;
    return crypto.HmacSHA256(data, this.checksumKey).toString(crypto.enc.Hex);
  }

  async handlePaymentWebhook(data: any) {
    console.log('Webhook data:', JSON.stringify(data, null, 2));
    const payload = data.data || data;

    let bill = null;
    if (payload.paymentLinkId) {
      bill = await this.billModel.findOne({ payment_link_id: payload.paymentLinkId });
    }
    if (!bill && payload.orderCode) {
      bill = await this.billModel.findOne({ order_code: payload.orderCode });
    }
    if (!bill) {
      throw new BadRequestException('Cannot find bill by paymentLinkId or orderCode');
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
}