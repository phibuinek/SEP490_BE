import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'newpassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
} 