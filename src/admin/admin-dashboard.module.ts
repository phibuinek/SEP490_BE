import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import { CarePlanAssignment, CarePlanAssignmentSchema } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentSchema } from '../bed-assignments/schemas/bed-assignment.schema';
import { RegistrationPackage, RegistrationPackageSchema } from '../registration-packages/schemas/registration-package.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resident.name, schema: ResidentSchema },
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
      { name: RegistrationPackage.name, schema: RegistrationPackageSchema },
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}
