import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPaymentLink(createPaymentDto);
  }

  @Get('success')
  handlePaymentSuccess(
    @Query() query: any,
    @Res() res: Response,
  ) {
    // Handle successful payment logic, e.g., update order status
    console.log('Payment successful:', query);
    res.redirect('http://localhost:3001/payment/success'); // Redirect to frontend
  }

  @Get('cancel')
  handlePaymentCancel(
    @Query() query: any,
    @Res() res: Response,
  ) {
    // Handle cancelled payment logic
    console.log('Payment cancelled:', query);
    res.redirect('http://localhost:3001/payment/cancel'); // Redirect to frontend
  }

  @Post('webhook')
  handleWebhook(@Body() data: any) {
    return this.paymentService.handlePaymentWebhook(data);
  }
} 