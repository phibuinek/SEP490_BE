import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength, IsArray, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'newPassword123', minLength: 6, description: 'Mật khẩu mới (tùy chọn)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ type: [String], example: ['60d...'], description: 'Cập nhật danh sách ID người thân' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  residents?: string[];
} 