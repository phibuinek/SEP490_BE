import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';

@Controller('residents')
@UseGuards(RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  create(@Body() createResidentDto: CreateResidentDto) {
    return this.residentsService.create(createResidentDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  findAll() {
    return this.residentsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY_MEMBER)
  findOne(@Param('id') id: string) {
    return this.residentsService.findOne(id);
  }

  @Post(':id/family-members/:familyMemberId')
  @Roles(Role.ADMIN, Role.STAFF)
  addFamilyMember(@Param('id') id: string, @Param('familyMemberId') familyMemberId: string) {
    return this.residentsService.addFamilyMember(id, familyMemberId);
  }

  @Delete(':id/family-members/:familyMemberId')
  @Roles(Role.ADMIN, Role.STAFF)
  removeFamilyMember(@Param('id') id: string, @Param('familyMemberId') familyMemberId: string) {
    return this.residentsService.removeFamilyMember(id, familyMemberId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  update(@Param('id') id: string, @Body() updateResidentDto: UpdateResidentDto) {
    return this.residentsService.update(id, updateResidentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.residentsService.remove(id);
  }
}
