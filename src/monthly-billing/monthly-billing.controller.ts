import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { MonthlyBillingService } from './monthly-billing.service';

@ApiTags('Monthly Billing')
@ApiBearerAuth()
@Controller('monthly-billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonthlyBillingController {
  constructor(private readonly monthlyBillingService: MonthlyBillingService) {}

  @Post('generate-bills')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Manually trigger monthly bill generation (Admin only)' })
  async generateBillsManually() {
    await this.monthlyBillingService.generateBillsManually();
    return { message: 'Monthly bill generation completed' };
  }
}

