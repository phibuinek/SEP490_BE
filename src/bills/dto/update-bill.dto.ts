import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsOptional, IsString, IsEnum } from 'class-validator';
import { Schema } from 'mongoose';
import { BillStatus, PaymentMethod } from '../schemas/bill.schema';

export class UpdateBillDto {
  @ApiPropertyOptional({ example: 35000000, description: 'Số tiền' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: '2024-03-01T00:00:00.000Z', description: 'Ngày đến hạn' })
  @IsOptional()
  @IsDateString()
  due_date?: Date;

  @ApiPropertyOptional({ example: 'Hóa đơn tháng 2/2024 cho gói chăm sóc cao cấp', description: 'Tiêu đề hóa đơn' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Chưa thanh toán cho gói cao cấp + phòng 2 giường tháng 2/2024', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: BillStatus, example: BillStatus.PENDING, description: 'Trạng thái hóa đơn' })
  @IsOptional()
  @IsEnum(BillStatus)
  status?: BillStatus;

  @ApiPropertyOptional({ example: '2024-03-10T00:00:00.000Z', description: 'Ngày thanh toán' })
  @IsOptional()
  @IsDateString()
  paid_date?: Date;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.QR_PAYMENT, description: 'Phương thức thanh toán' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({ example: '605c5f2e8e3b3a2f8c8e4b1c', description: 'ID của care plan assignment' })
  @IsOptional()
  @IsMongoId()
  care_plan_assignment_id?: Schema.Types.ObjectId;
}
