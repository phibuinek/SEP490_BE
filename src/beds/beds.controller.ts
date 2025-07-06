import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bed, BedDocument } from './schemas/bed.schema';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Beds')
@ApiBearerAuth()
@Controller('beds')
export class BedsController {
  constructor(
    @InjectModel(Bed.name) private bedModel: Model<BedDocument>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bed' })
  @ApiResponse({ status: 201, type: Bed })
  async create(@Body() createBedDto: CreateBedDto) {
    return this.bedModel.create(createBedDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all beds' })
  async findAll() {
    return this.bedModel.find();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bed by ID' })
  async findOne(@Param('id') id: string) {
    return this.bedModel.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bed' })
  async update(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto) {
    return this.bedModel.findByIdAndUpdate(id, updateBedDto, { new: true });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bed' })
  async remove(@Param('id') id: string) {
    return this.bedModel.findByIdAndDelete(id);
  }
} 