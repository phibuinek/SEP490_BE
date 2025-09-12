import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BedAssignmentDocument = BedAssignment & Document;

@Schema({
  collection: 'bed_assignments',
  timestamps: false,
})
export class BedAssignment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Resident' })
  resident_id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Bed' })
  bed_id: Types.ObjectId;

  @Prop({ required: true })
  assigned_date: Date;

  @Prop({ type: Date, required: false, default: null })
  unassigned_date?: Date | null;

  @Prop({
    enum: [
      'active',
      'accepted',
      'pending',
      'rejected',
      'discharged',
      'exchanged',
    ],
    required: true,
  })
  status: string;

  @Prop({ type: String, required: false, default: null })
  reason?: string | null;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  assigned_by: Types.ObjectId;
}

export const BedAssignmentSchema = SchemaFactory.createForClass(BedAssignment);
