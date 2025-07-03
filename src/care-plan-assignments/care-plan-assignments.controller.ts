import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CarePlanAssignmentsService } from './care-plan-assignments.service';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('care-plan-assignments')
@Controller('care-plan-assignments')
export class CarePlanAssignmentsController {
  constructor(
    private readonly carePlanAssignmentsService: CarePlanAssignmentsService,
  ) {}

  @Post()
  create(@Body() createCarePlanAssignmentDto: CreateCarePlanAssignmentDto) {
    return this.carePlanAssignmentsService.create(createCarePlanAssignmentDto);
  }

  @Get()
  findAll() {
    return this.carePlanAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carePlanAssignmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCarePlanAssignmentDto: UpdateCarePlanAssignmentDto,
  ) {
    return this.carePlanAssignmentsService.update(
      id,
      updateCarePlanAssignmentDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carePlanAssignmentsService.remove(id);
  }
} 