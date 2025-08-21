import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'ID người nhận' })
  @IsMongoId()
  receiver_id: string;

  @ApiProperty({ 
    description: 'ID cư dân liên quan (bắt buộc)',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  resident_id: string;

  @ApiProperty({ description: 'URL đính kèm (tùy chọn)' })
  @IsOptional()
  @IsString()
  attachment?: string;
}

