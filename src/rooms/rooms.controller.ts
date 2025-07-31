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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Public()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('filter')
  async filterRooms(
    @Query('room_type') room_type?: string,
    @Query('status') status?: string,
    @Query('main_care_plan_id') main_care_plan_id?: string,
    @Query('gender') gender?: string,
  ) {
    return this.roomsService.filterRooms(room_type, status, main_care_plan_id, gender);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  @Post('update-all-statuses')
  @Public()
  async updateAllRoomStatuses() {
    await this.roomsService.updateAllRoomStatuses();
    return { message: 'All room statuses updated successfully' };
  }
}
