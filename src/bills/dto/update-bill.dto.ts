import { PartialType } from '@nestjs/mapped-types';
import { CreateBillDto } from './create-bill.dto';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { BillStatus } from '../enums/bill-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export class UpdateBillDto extends PartialType(CreateBillDto) {
  @IsEnum(BillStatus)
  @IsOptional()
  status?: BillStatus;

  @IsDate()
  @IsOptional()
  paid_date?: Date;

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;
}
