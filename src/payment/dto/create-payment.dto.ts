import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 10000,
    description: 'Amount of money to be paid',
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'Thanh toan don hang',
    description: 'Description for the payment',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
} 