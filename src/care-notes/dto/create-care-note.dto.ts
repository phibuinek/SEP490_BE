import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCareNoteDto {
  @ApiProperty({ example: '2024-07-13T09:30:00Z', description: 'Ngày ghi chú (ISO string)' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'Tham gia tập thể dục buổi sáng rất tích cực. Ăn hết 100% bữa sáng.', description: 'Nội dung ghi chú' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '66b54634d29ee1e4a3e79952', description: 'ID của cư dân (resident)' })
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @ApiProperty({ example: '66b54634d29ee1e4a3e79951', description: 'ID của nhân viên (staff)', required: false })
  @IsOptional()
  @IsString()
  staffId?: string;
} 