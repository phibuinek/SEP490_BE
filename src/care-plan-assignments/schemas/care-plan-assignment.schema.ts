import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CarePlanAssignmentDocument = CarePlanAssignment & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class CarePlanAssignment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staff_id: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'CarePlan', required: true })
  care_plan_ids: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  family_member_id: Types.ObjectId | null;

  @Prop({ required: true })
  registration_date: Date;

  @Prop({ type: String, default: null })
  consultation_notes?: string | null;

  @Prop({
    enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'],
    required: true,
  })
  selected_room_type: string;

  @Prop({ type: Types.ObjectId, ref: 'Room', default: null })
  assigned_room_id?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Bed', default: null })
  assigned_bed_id?: Types.ObjectId | null;

  @Prop({
    type: {
      preferred_room_gender: { type: String, enum: ['male', 'female'], default: null },
      preferred_floor: { type: Number, default: null },
      special_requests: { type: String, default: null },
    },
    default: null,
  })
  family_preferences?: {
    preferred_room_gender?: 'male' | 'female' | null;
    preferred_floor?: number | null;
    special_requests?: string | null;
  } | null;

  @Prop({ type: Number, min: 0, default: null })
  total_monthly_cost: number | null;

  @Prop({ type: Number, min: 0, default: null })
  room_monthly_cost: number | null;

  @Prop({ type: Number, min: 0, default: null })
  care_plans_monthly_cost: number | null;

  @Prop({ required: true })
  start_date: Date;

  @Prop({ type: Date, default: null })
  end_date?: Date | null;

  @Prop({
    type: [
      {
        medication_name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
      },
    ],
    default: null,
  })
  additional_medications?: Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
  }> | null;

  @Prop({
    enum: [
      'packages_selected',
      'room_assigned',
      'payment_completed',
      'active',
      'completed',
      'cancelled',
      'paused',
    ],
    required: true,
  })
  status: string;

  @Prop({ type: String, default: null })
  notes?: string | null;

  @Prop({ required: true, default: Date.now })
  created_at: Date;

  @Prop({ required: true, default: Date.now })
  updated_at: Date;
}

export const CarePlanAssignmentSchema =
  SchemaFactory.createForClass(CarePlanAssignment);
