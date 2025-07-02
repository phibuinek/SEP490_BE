import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VitalSignDocument = VitalSign & Document;

@Schema({ timestamps: true })
export class VitalSign {
  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  residentId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: false })
  bloodPressure?: string;

  @Prop({ required: false })
  heartRate?: number;

  @Prop({ required: false })
  temperature?: number;

  @Prop({ required: false })
  weight?: number;

  @Prop({ required: false })
  note?: string;
}

export const VitalSignSchema = SchemaFactory.createForClass(VitalSign); 