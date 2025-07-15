import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VitalSignDocument = VitalSign & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class VitalSign {
  @Prop({
    type: Types.ObjectId,
    ref: 'Resident',
    required: true,
    name: 'resident_id',
  })
  residentId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    name: 'recorded_by',
  })
  recordedBy: Types.ObjectId;

  @Prop({ required: true, name: 'date_time' })
  dateTime: Date;

  @Prop({ required: false })
  temperature?: number; // C

  @Prop({ required: false, name: 'heart_rate' })
  heartRate?: number; // bpm

  @Prop({ required: false, name: 'blood_pressure' })
  bloodPressure?: string; // mmHg

  @Prop({ required: false, name: 'respiratory_rate' })
  respiratoryRate?: number; // breaths per minute

  @Prop({ required: false, name: 'oxygen_level' })
  oxygenLevel?: number; // %

  @Prop({ required: false })
  weight?: number; // kg

  @Prop({ required: false })
  notes?: string;
}

export const VitalSignSchema = SchemaFactory.createForClass(VitalSign);
