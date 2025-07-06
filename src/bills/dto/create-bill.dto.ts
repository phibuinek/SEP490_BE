import { IsDateString, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Schema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/bill.schema';
import { BillStatus } from '../schemas/bill.schema';

export class CreateBillDto {
  @ApiProperty({ example: '605c5f2e8e3b3a2f8c8e4b1a', description: 'ID của family member' })
  @IsMongoId()
  @IsNotEmpty()
  readonly family_member_id: Schema.Types.ObjectId;

  @ApiProperty({ example: '605c5f2e8e3b3a2f8c8e4b1b', description: 'ID của resident' })
  @IsMongoId()
  @IsNotEmpty()
  readonly resident_id: Schema.Types.ObjectId;
  
  @ApiProperty({ example: '605c5f2e8e3b3a2f8c8e4b1c', description: 'ID của care plan' })
  @IsMongoId()
  @IsNotEmpty()
  readonly care_plan_id: Schema.Types.ObjectId;

  @ApiProperty({ example: '605c5f2e8e3b3a2f8c8e4b1d', description: 'ID của staff' })
  @IsMongoId()
  @IsNotEmpty()
  readonly staff_id: Schema.Types.ObjectId;

  @ApiProperty({ example: 35000000, description: 'Số tiền' })
  @IsNotEmpty()
  readonly amount: number;

  @ApiProperty({ example: '2024-03-01T00:00:00.000Z', description: 'Ngày đến hạn' })
  @IsDateString()
  @IsNotEmpty()
  readonly due_date: Date;

  @ApiProperty({ example: '2024-03-05T00:00:00.000Z', description: 'Ngày đã thanh toán', required: false })
  @IsDateString()
  @IsOptional()
  readonly paid_date?: Date;

  @ApiProperty({ example: 'bank_transfer', enum: PaymentMethod, description: 'Phương thức thanh toán', required: false })
  @IsOptional()
  readonly payment_method?: PaymentMethod;

  @ApiProperty({ example: 'pending', enum: BillStatus, description: 'Trạng thái hóa đơn', required: false })
  @IsOptional()
  readonly status?: BillStatus;

  @ApiProperty({ example: 'Chưa thanh toán cho gói cao cấp + phòng 2 giường tháng 2/2024', required: false })
  @IsString()
  @IsOptional()
  readonly notes?: string;
} 