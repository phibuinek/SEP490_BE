import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment link for a bill' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment link created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPaymentLink(createPaymentDto);
  }

  @Get('success')
  @Public()
  @ApiOperation({ summary: 'Handle payment success callback (web and mobile)' })
  @ApiResponse({ status: 200, description: 'Payment success response.' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend on success.' })
  handlePaymentSuccess(@Query() query: any, @Res() res?: Response) {
    // Handle successful payment logic
    console.log('Payment successful:', query);
    
    // Kiểm tra nếu có billId để xác định platform
    const billId = query.billId;
    
    // Nếu có billId, có thể là mobile callback
    if (billId) {
      // Return JSON response for mobile app
      return {
        success: true,
        status: 'success',
        message: 'Thanh toán thành công',
        data: {
          orderCode: query.orderCode,
          transactionId: query.transactionId,
          amount: query.amount,
          paymentMethod: query.paymentMethod,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Redirect for web frontend
      if (res) {
        res.redirect('http://localhost:3000/payment/success');
      }
      return { message: 'Redirecting to web frontend' };
    }
  }

  @Get('cancel')
  @Public()
  @ApiOperation({ summary: 'Handle payment cancel callback (web and mobile)' })
  @ApiResponse({ status: 200, description: 'Payment cancel response.' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend on cancel.' })
  handlePaymentCancel(@Query() query: any, @Res() res?: Response) {
    // Handle cancelled payment logic
    console.log('Payment cancelled:', query);
    
    // Kiểm tra nếu có billId để xác định platform
    const billId = query.billId;
    
    // Nếu có billId, có thể là mobile callback
    if (billId) {
      // Return JSON response for mobile app
      return {
        success: false,
        status: 'cancelled',
        message: 'Thanh toán đã hủy',
        data: {
          orderCode: query.orderCode,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      // Redirect for web frontend
      if (res) {
        res.redirect('http://localhost:3000/payment/cancel');
      }
      return { message: 'Redirecting to web frontend' };
    }
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Handle payment webhook from PayOS' })
  @ApiBody({ description: 'Webhook payload', type: Object })
  @ApiResponse({ status: 200, description: 'Webhook received.' })
  handleWebhook(@Body() data: any) {
    console.log('=== PAYOS WEBHOOK RECEIVED ===');
    console.log('Headers:', JSON.stringify(data, null, 2));
    console.log('Data type:', typeof data);
    console.log('Data keys:', Object.keys(data));
    console.log('==============================');
    
    try {
      const result = this.paymentService.handlePaymentWebhook(data);
      console.log('Webhook processed successfully:', result);
      return result;
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  @Get('status/:billId')
  @ApiOperation({ summary: 'Check payment status for a bill' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved.' })
  async checkPaymentStatus(@Query('billId') billId: string) {
    return this.paymentService.checkPaymentStatus(billId);
  }
}