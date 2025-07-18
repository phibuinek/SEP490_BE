import { PartialType } from '@nestjs/mapped-types';
import { CreateBillDto } from './create-bill.dto';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Schema } from 'mongoose';
import { BillStatus, PaymentMethod } from '../schemas/bill.schema';

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

  care_plan_assignment_id?: Schema.Types.ObjectId;
  title?: string;
}
