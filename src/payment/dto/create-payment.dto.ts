// dto/create-payment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: '64e0123abc4567ef89a0b1cd' })
  @IsMongoId()
  @IsNotEmpty()
  bill_id: string;
}
