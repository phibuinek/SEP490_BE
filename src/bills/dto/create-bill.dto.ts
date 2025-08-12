import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Schema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../schemas/bill.schema';
import { BillStatus } from '../schemas/bill.schema';

export class CreateBillDto {
  // Đã xóa trường family_member_id, BE sẽ tự động lấy từ resident_id

  @ApiProperty({
    example: '605c5f2e8e3b3a2f8c8e4b1b',
    description: 'ID của resident',
  })
  @IsMongoId()
  @IsNotEmpty()
  readonly resident_id: Schema.Types.ObjectId;

  @ApiProperty({
    example: '605c5f2e8e3b3a2f8c8e4b1c',
    description: 'ID của care plan assignment (có thể null để tính tổng tất cả)',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  readonly care_plan_assignment_id?: Schema.Types.ObjectId;

  @ApiProperty({
    example: '605c5f2e8e3b3a2f8c8e4b1d',
    description: 'ID của staff',
  })
  @IsMongoId()
  @IsNotEmpty()
  readonly staff_id: Schema.Types.ObjectId;

  @ApiProperty({ example: 35000000, description: 'Số tiền' })
  @IsNotEmpty()
  readonly amount: number;

  @ApiProperty({
    example: '2024-03-01T00:00:00.000Z',
    description: 'Ngày đến hạn',
  })
  @IsDateString()
  @IsNotEmpty()
  readonly due_date: Date;

  @ApiProperty({
    example: 'Hóa đơn tháng 2/2024 cho gói chăm sóc cao cấp',
    description: 'Tiêu đề hóa đơn',
  })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({
    example: 'Chưa thanh toán cho gói cao cấp + phòng 2 giường tháng 2/2024',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly notes?: string;

  @ApiProperty({
    description: 'Chi tiết hóa đơn (tự động tính từ BE)',
    required: false,
  })
  @IsOptional()
  readonly billing_details?: any;
}
