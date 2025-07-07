import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CarePlansService } from './care-plans.service';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssignCarePlanDto } from './dto/assign-care-plan.dto';

@ApiTags('CarePlans')
@ApiBearerAuth()
@Controller('care-plans')
export class CarePlansController {
  constructor(private readonly carePlansService: CarePlansService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new care plan (Admin only)' })
  @ApiResponse({ status: 201, description: 'Care plan created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() createCarePlanDto: CreateCarePlanDto) {
    return this.carePlansService.create(createCarePlanDto);
  }

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Register care plan for resident (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Care plan registered for resident.' })
  async registerCarePlanForResident(
    @Body() dto: AssignCarePlanDto
  ) {
    console.log('Controller params:', { carePlanId: dto.carePlanId, residentId: dto.residentId });
    return await this.carePlansService.assignCarePlanToResident(dto.carePlanId, dto.residentId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all care plans (All roles)' })
  @ApiResponse({ status: 200, description: 'List all care plans.' })
  async findAll() {
    return await this.carePlansService.findAll();
  }

  @Get('by-family')
  @Roles(Role.FAMILY_MEMBER)
  @ApiOperation({ summary: 'Get care plans by familyId (Family only)' })
  @ApiResponse({ status: 200, description: 'List care plans by family.' })
  async getCarePlansByFamily(@Query('familyId') familyId: string) {
    return this.carePlansService.findByFamilyId(familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get care plan by ID (All roles)' })
  @ApiResponse({ status: 200, description: 'Get care plan by ID.' })
  @ApiResponse({ status: 404, description: 'Care plan not found.' })
  findOne(@Param('id') id: string) {
    return this.carePlansService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update care plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Care plan updated.' })
  @ApiResponse({ status: 404, description: 'Care plan not found.' })
  update(@Param('id') id: string, @Body() updateCarePlanDto: UpdateCarePlanDto) {
    return this.carePlansService.update(id, updateCarePlanDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete care plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Care plan deleted.' })
  @ApiResponse({ status: 404, description: 'Care plan not found.' })
  remove(@Param('id') id: string) {
    return this.carePlansService.remove(id);
  }
} 