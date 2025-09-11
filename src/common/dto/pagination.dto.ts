import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max, IsString, IsEnum } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'created_at',
    example: 'created_at',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  // Helper methods
  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 10);
  }

  get sort(): { [key: string]: 1 | -1 } {
    const sortBy = this.sortBy || 'created_at';
    const sortOrder = this.sortOrder || 'desc';
    return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  }
}

export class PaginatedResponse<T> {
  @ApiPropertyOptional()
  data: T[];

  @ApiPropertyOptional()
  total: number;

  @ApiPropertyOptional()
  page: number;

  @ApiPropertyOptional()
  limit: number;

  @ApiPropertyOptional()
  totalPages: number;

  @ApiPropertyOptional()
  hasNext: boolean;

  @ApiPropertyOptional()
  hasPrev: boolean;

  constructor(data: T[], total: number, pagination: PaginationDto) {
    this.data = data;
    this.total = total;
    this.page = pagination.page || 1;
    this.limit = pagination.limit || 10;
    this.totalPages = Math.ceil(total / (pagination.limit || 10));
    this.hasNext = (pagination.page || 1) < this.totalPages;
    this.hasPrev = (pagination.page || 1) > 1;
  }
}
