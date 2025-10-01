import { Controller } from '@nestjs/common';
import { MonthlyBillingService } from './monthly-billing.service';

@Controller('monthly-billing')
export class MonthlyBillingController {
  constructor(private readonly monthlyBillingService: MonthlyBillingService) {}
}
