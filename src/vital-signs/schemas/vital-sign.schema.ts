import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VitalSignDocument = VitalSign & Document;

@Schema({ 
  collection: 'vital_signs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class VitalSign {
  @Prop({
    type: Types.ObjectId,
    ref: 'Resident',
    required: true,
  })
  resident_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  recorded_by: Types.ObjectId;

  @Prop({ required: true })
  date_time: Date;

  @Prop({ required: false })
  temperature?: number; // C

  @Prop({ required: false })
  heart_rate?: number; // bpm

  @Prop({ required: false })
  blood_pressure?: string; // mmHg

  @Prop({ required: false })
  respiratory_rate?: number; // breaths per minute

  @Prop({ required: false })
  oxygen_level?: number; // %

  @Prop({ required: false })
  weight?: number; // kg

  @Prop({ required: false })
  notes?: string;
}

export const VitalSignSchema = SchemaFactory.createForClass(VitalSign);
