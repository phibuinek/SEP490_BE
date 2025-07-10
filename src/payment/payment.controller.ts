import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

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
  @ApiOperation({ summary: 'Handle payment success callback (redirect)' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend on success.' })
  handlePaymentSuccess(
    @Query() query: any,
    @Res() res: Response,
  ) {
    // Handle successful payment logic, e.g., update order status
    console.log('Payment successful:', query);
    res.redirect('http://localhost:3001/payment/success'); // Redirect to frontend
  }

  @Get('cancel')
  @ApiOperation({ summary: 'Handle payment cancel callback (redirect)' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend on cancel.' })
  handlePaymentCancel(
    @Query() query: any,
    @Res() res: Response,
  ) {
    // Handle cancelled payment logic
    console.log('Payment cancelled:', query);
    res.redirect('http://localhost:3001/payment/cancel'); // Redirect to frontend
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle payment webhook from PayOS' })
  @ApiBody({ description: 'Webhook payload', type: Object })
  @ApiResponse({ status: 200, description: 'Webhook received.' })
  handleWebhook(@Body() data: any) {
    return this.paymentService.handlePaymentWebhook(data);
  }
} 