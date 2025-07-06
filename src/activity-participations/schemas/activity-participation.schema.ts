import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityParticipationDocument = ActivityParticipation & Document;

export enum AttendanceStatus {
  ATTENDED = 'attended',
  EXCUSED = 'excused',
  ABSENT = 'absent',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ActivityParticipation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, name: 'staff_id' })
  staffId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true, name: 'activity_id' })
  activityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true, name: 'resident_id' })
  residentId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ name: 'performance_notes' })
  performanceNotes: string;

  @Prop({
    type: String,
    enum: AttendanceStatus,
    required: true,
    name: 'attendance_status',
  })
  attendanceStatus: AttendanceStatus;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    name: 'approval_status',
  })
  approvalStatus: string;
}

export const ActivityParticipationSchema = SchemaFactory.createForClass(ActivityParticipation); 