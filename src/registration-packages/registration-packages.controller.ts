import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RegistrationPackagesService } from './registration-packages.service';
import { CreateRegistrationPackageDto } from './dto/create-registration-package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('registration-packages')
@ApiBearerAuth()
@Controller('registration-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrationPackagesController {
  constructor(
    private readonly registrationPackagesService: RegistrationPackagesService,
  ) {}

  @Post()
  @Roles(Role.FAMILY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new registration package' })
  @ApiResponse({
    status: 201,
    description: 'Registration package created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createRegistrationPackageDto: CreateRegistrationPackageDto,
    @Req() req,
  ) {
    return this.registrationPackagesService.create(
      createRegistrationPackageDto,
      req.user.userId,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all registration packages' })
  @ApiResponse({
    status: 200,
    description: 'Registration packages retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.registrationPackagesService.findAll();
  }

  @Get('admin/pending')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pending registration packages for admin review' })
  @ApiResponse({
    status: 200,
    description: 'Pending registration packages retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getPendingPackages() {
    return this.registrationPackagesService.getPendingPackages();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a registration package by ID' })
  @ApiParam({ name: 'id', description: 'Registration package ID' })
  @ApiResponse({
    status: 200,
    description: 'Registration package retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Registration package not found' })
  findOne(@Param('id') id: string) {
    return this.registrationPackagesService.findOne(id);
  }

  @Patch('admin/:id/approve')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a registration package' })
  @ApiParam({ name: 'id', description: 'Registration package ID' })
  @ApiResponse({
    status: 200,
    description: 'Registration package approved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  approvePackage(@Param('id') id: string, @Req() req) {
    return this.registrationPackagesService.approvePackage(id, req.user.userId);
  }

  @Patch('admin/:id/reject')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a registration package' })
  @ApiParam({ name: 'id', description: 'Registration package ID' })
  @ApiResponse({
    status: 200,
    description: 'Registration package rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  rejectPackage(@Param('id') id: string, @Body() body: { reason?: string }, @Req() req) {
    return this.registrationPackagesService.rejectPackage(id, req.user.userId, body.reason);
  }

  @Patch('admin/:id/activate')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a registration package (after payment)' })
  @ApiParam({ name: 'id', description: 'Registration package ID' })
  @ApiResponse({
    status: 200,
    description: 'Registration package activated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  activatePackage(@Param('id') id: string) {
    return this.registrationPackagesService.activatePackage(id);
  }
}
