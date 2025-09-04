import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffAssignmentDocument = StaffAssignment & Document;

export enum AssignmentStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

@Schema({
  collection: 'staff_assignments',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class StaffAssignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staff_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  room_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assigned_by: Types.ObjectId; // Admin who made the assignment

  @Prop({ required: true })
  assigned_date: Date;

  @Prop({ type: Date, default: null })
  end_date?: Date | null;

  @Prop({
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus = AssignmentStatus.ACTIVE;

  @Prop({ type: String, default: null })
  notes?: string | null;

  @Prop({ type: [String], default: [] })
  responsibilities: string[]; // e.g., ['vital_signs', 'care_notes', 'activities', 'photos']

  @Prop({ required: true })
  created_at: Date;

  @Prop({ required: true })
  updated_at: Date;
}

export const StaffAssignmentSchema =
  SchemaFactory.createForClass(StaffAssignment);

// Create compound index to ensure unique staff-room assignments
StaffAssignmentSchema.index({ staff_id: 1, room_id: 1 }, { unique: true });
