import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CarePlansService } from './care-plans.service';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('care-plans')
export class CarePlansController {
  constructor(private readonly carePlansService: CarePlansService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createCarePlanDto: CreateCarePlanDto) {
    return this.carePlansService.create(createCarePlanDto);
  }

  @Get()
  findAll() {
    return this.carePlansService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carePlansService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateCarePlanDto: UpdateCarePlanDto) {
    return this.carePlansService.update(id, updateCarePlanDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.carePlansService.remove(id);
  }
} 