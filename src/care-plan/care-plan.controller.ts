import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CarePlanService } from './care-plan.service';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Care Plans')
@Controller('care-plans')
export class CarePlanController {
  constructor(private readonly service: CarePlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new care plan' })
  create(@Body() dto: CreateCarePlanDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all care plans' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a care plan by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a care plan' })
  update(@Param('id') id: string, @Body() dto: UpdateCarePlanDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a care plan' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
} 