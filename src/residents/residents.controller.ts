import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('residents')
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new resident' })
  @ApiResponse({ status: 201, description: 'The resident has been successfully created.' })
  create(@Body() createResidentDto: CreateResidentDto) {
    return this.residentsService.create(createResidentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all residents' })
  findAll() {
    return this.residentsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.FAMILY)
  @ApiOperation({ summary: 'Get a resident by ID' })
  findOne(@Param('id') id: string) {
    // TODO: Add logic for Family to only see their own resident
    return this.residentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update a resident' })
  update(@Param('id') id: string, @Body() updateResidentDto: UpdateResidentDto) {
    return this.residentsService.update(id, updateResidentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a resident' })
  remove(@Param('id') id: string) {
    return this.residentsService.remove(id);
  }
}
