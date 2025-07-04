import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto-js';
import * as moment from 'moment';
import { CarePlansService } from 'src/care-plans/care-plans.service';
import { CreatePaymentDto } from './dto/create-payment.dto';



@Injectable()
export class PaymentService {
  private readonly clientId = 'd89d5297-4ff5-4f10-9d44-c8dd3f68f71b';
  private readonly apiKey = '79bc8e19-0dc0-4111-95ff-69bf4687858e';
  private readonly checksumKey =
    '0ecbdbfa3f52b73dacdd2790501563fccca43d92e039e37aef14ffca2850d147';
  private readonly payosUrl = 'https://api-merchant.payos.vn/v2/payment-requests';
  constructor(private readonly careplanService: CarePlansService) {}

  async createPaymentLink(createPaymentDto: CreatePaymentDto) {
    const careplan = await this.careplanService.findOne(createPaymentDto.carePlan);
    if (!careplan) throw new Error('Careplan không tồn tại');

    const amount = careplan.monthlyPrice;
    const orderCode = this.generateOrderCode();
    const description = `Thanh toán gói chăm sóc: ${careplan.planName || careplan._id}`;

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
      console.error('Error creating payment link:', error.response?.data || error.message);
      throw new Error('Failed to create payment link');
    }
  }

  private generateOrderCode(): number {
    return parseInt(moment().format('YYMMDDHHmmss'));
  }

  private generateSignature(amount: number, orderCode: number, description: string): string {
    const data = `amount=${amount}&cancelUrl=http://localhost:8000/payment/cancel&description=${description}&orderCode=${orderCode}&returnUrl=http://localhost:8000/payment/success`;
    return crypto.HmacSHA256(data, this.checksumKey).toString(crypto.enc.Hex);
  }  

  handlePaymentWebhook(data: any) {
    // Implement webhook handling logic here
    console.log('Webhook received:', data);
    return { message: 'Webhook received' };
  }
} 