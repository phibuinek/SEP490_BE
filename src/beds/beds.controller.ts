import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BedsService } from './beds.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('Beds')
@ApiBearerAuth()
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Post()
  create(@Body() createBedDto: CreateBedDto) {
    return this.bedsService.create(createBedDto);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false, description: 'Trạng thái bed: available hoặc occupied' })
  findAll(@Query('status') status?: string) {
    return this.bedsService.findAllByStatus(status);
  }

  @Get('available')
  getAvailableBeds() {
    return this.bedsService.findAllByStatus('available');
  }

  @Get('occupied') 
  getOccupiedBeds() {
    return this.bedsService.findAllByStatus('occupied');
  }

  @Get('by-room/:room_id')
  @ApiQuery({ name: 'status', required: false, description: 'Trạng thái bed: available hoặc occupied' })
  async getBedsByRoom(@Param('room_id') room_id: string, @Query('status') status?: string) {
    return this.bedsService.findByRoomIdWithStatus(room_id, status);
  }

  @Get('available/by-room/:room_id')
  async getAvailableBedsByRoom(@Param('room_id') room_id: string) {
    return this.bedsService.findByRoomIdWithStatus(room_id, 'available');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bedsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto) {
    return this.bedsService.update(id, updateBedDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bedsService.remove(id);
  }
}
