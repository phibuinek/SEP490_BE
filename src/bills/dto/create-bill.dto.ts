import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-method.enum';
import { BillStatus } from '../enums/bill-status.enum';

export class CreateBillDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  family_member_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  resident_id: string;

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  care_plan_assignment_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  staff_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  due_date: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  paid_date: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ enum: BillStatus })
  @IsOptional()
  @IsEnum(BillStatus)
  status: BillStatus;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes: string;
} 