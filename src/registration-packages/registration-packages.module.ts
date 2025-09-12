import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrationPackagesController } from './registration-packages.controller';
import { RegistrationPackagesService } from './registration-packages.service';
import { RegistrationPackage, RegistrationPackageSchema } from './schemas/registration-package.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import { CarePlanAssignment, CarePlanAssignmentSchema } from '../care-plan-assignments/schemas/care-plan-assignment.schema';
import { BedAssignment, BedAssignmentSchema } from '../bed-assignments/schemas/bed-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrationPackage.name, schema: RegistrationPackageSchema },
      { name: Resident.name, schema: ResidentSchema },
      { name: CarePlanAssignment.name, schema: CarePlanAssignmentSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
  ],
  controllers: [RegistrationPackagesController],
  providers: [RegistrationPackagesService],
  exports: [RegistrationPackagesService],
})
export class RegistrationPackagesModule {}
