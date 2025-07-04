import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { VitalSignsService } from './vital-signs.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Vital Signs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vital-signs')
export class VitalSignsController {
  constructor(private readonly service: VitalSignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vital sign record' })
  create(@Body() dto: CreateVitalSignDto, @Request() req) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vital sign records' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vital sign record by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vital sign record' })
  update(@Param('id') id: string, @Body() dto: UpdateVitalSignDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vital sign record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
} 