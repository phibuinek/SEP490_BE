import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CarePlanAssignmentsService } from './care-plan-assignments.service';
import { CreateCarePlanAssignmentDto } from './dto/create-care-plan-assignment.dto';
import { UpdateCarePlanAssignmentDto } from './dto/update-care-plan-assignment.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('care-plan-assignments')
@ApiBearerAuth()
@Controller('care-plan-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarePlanAssignmentsController {
  constructor(
    private readonly carePlanAssignmentsService: CarePlanAssignmentsService,
  ) {}

  @Post()
  @Roles(Role.FAMILY, Role.ADMIN, Role.STAFF)
  create(
    @Body() createCarePlanAssignmentDto: CreateCarePlanAssignmentDto,
    @Req() req: any,
  ) {
    return this.carePlanAssignmentsService.create(
      createCarePlanAssignmentDto,
      req,
    );
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