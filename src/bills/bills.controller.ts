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
// import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { BillsService } from './bills.service';

@ApiTags('Bills')
@ApiBearerAuth()
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bill' })
  @ApiResponse({ status: 201, description: 'Bill created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() createBillDto: CreateBillDto) {
    return this.billsService.create(createBillDto).then((bill) => ({
      ...bill.toObject(),
      id: bill._id,
    }));
  }

  @Get()
  @ApiOperation({ summary: 'Get all bills' })
  @ApiResponse({ status: 200, description: 'List all bills.' })
  findAll() {
    return this.billsService.findAll();
  }

  @Get('by-resident')
  @ApiOperation({ summary: 'Get bills by resident_id' })
  @ApiResponse({ status: 200, description: 'List of bills for the resident.' })
  async getBillsByResident(@Query('resident_id') resident_id: string) {
    return this.billsService.findByResidentId(resident_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill by ID' })
  @ApiResponse({ status: 200, description: 'Get bill by ID.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  findOne(@Param('id') id: string) {
    return this.billsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bill' })
  @ApiResponse({ status: 200, description: 'Bill updated.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billsService.update(id, updateBillDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bill' })
  @ApiResponse({ status: 200, description: 'Bill deleted.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  remove(@Param('id') id: string) {
    return this.billsService.remove(id);
  }
}
