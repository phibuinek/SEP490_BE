import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('transactions')
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description: 'Từ ngày (yyyy-mm-dd)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description: 'Đến ngày (yyyy-mm-dd)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['income', 'expense', 'all'],
    description: 'Loại giao dịch',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'completed', 'failed'],
    description: 'Trạng thái',
  })
  getTransactions(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.getTransactions({
      fromDate,
      toDate,
      type,
      status,
    });
  }
}
