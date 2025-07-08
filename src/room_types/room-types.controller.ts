import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Room Types')
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly service: RoomTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới loại phòng' })
  create(@Body() createDto: CreateRoomTypeDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách loại phòng' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin loại phòng theo id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật loại phòng' })
  update(@Param('id') id: string, @Body() updateDto: UpdateRoomTypeDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa loại phòng' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
} 