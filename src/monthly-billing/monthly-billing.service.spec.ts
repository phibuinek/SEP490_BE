import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyBillingService } from './monthly-billing.service';

describe('MonthlyBillingService', () => {
  let service: MonthlyBillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonthlyBillingService],
    }).compile();

    service = module.get<MonthlyBillingService>(MonthlyBillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

