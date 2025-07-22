import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityParticipationDocument = ActivityParticipation & Document;

export enum AttendanceStatus {
  ATTENDED = 'attended',
  EXCUSED = 'excused',
  ABSENT = 'absent',
  PENDING = 'pending',
}

@Schema({ 
  collection: 'activity_participations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class ActivityParticipation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staff_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activity_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop()
  performance_notes: string;

  @Prop({
    type: String,
    enum: AttendanceStatus,
    required: true,
    default: AttendanceStatus.PENDING,
  })
  attendance_status: AttendanceStatus;
}

export const ActivityParticipationSchema = SchemaFactory.createForClass(
  ActivityParticipation,
);
