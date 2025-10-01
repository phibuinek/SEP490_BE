import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffAssignmentsService } from './staff-assignments.service';
import { StaffAssignmentsController } from './staff-assignments.controller';
import {
  StaffAssignment,
  StaffAssignmentSchema,
} from './schemas/staff-assignment.schema';
import { Resident, ResidentSchema } from '../residents/schemas/resident.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { Bed, BedSchema } from '../beds/schemas/bed.schema';
import { BedAssignment, BedAssignmentSchema } from '../bed-assignments/schemas/bed-assignment.schema';
import { MailService } from '../common/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffAssignment.name, schema: StaffAssignmentSchema },
      { name: Resident.name, schema: ResidentSchema },
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
      { name: Bed.name, schema: BedSchema },
      { name: BedAssignment.name, schema: BedAssignmentSchema },
    ]),
  ],
  controllers: [StaffAssignmentsController],
  providers: [StaffAssignmentsService, MailService],
  exports: [StaffAssignmentsService],
})
export class StaffAssignmentsModule {}
