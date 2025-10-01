import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpLoginDto {
  @ApiProperty({
    example: '0123456789',
    description: 'Số điện thoại (10-15 chữ số)',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^[0-9]{10,15}$/, {
    message: 'Số điện thoại phải có 10-15 chữ số',
  })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP (6 chữ số)',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @Matches(/^[0-9]{6}$/, {
    message: 'Mã OTP phải có 6 chữ số',
  })
  otp: string;
}

export class SendOtpDto {
  @ApiProperty({
    example: '0123456789',
    description: 'Số điện thoại (10-15 chữ số)',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^[0-9]{10,15}$/, {
    message: 'Số điện thoại phải có 10-15 chữ số',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '0123456789',
    description: 'Số điện thoại (10-15 chữ số)',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^[0-9]{10,15}$/, {
    message: 'Số điện thoại phải có 10-15 chữ số',
  })
  phone: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP (6 chữ số)',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @Matches(/^[0-9]{6}$/, {
    message: 'Mã OTP phải có 6 chữ số',
  })
  otp: string;
}







