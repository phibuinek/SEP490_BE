import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VisitDocument = Visit & Document;

@Schema({ 
  collection: 'visits',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class Visit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  family_member_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ required: true })
  visit_date: Date;

  @Prop({ required: true })
  visit_time: string;

  @Prop({ type: Number, min: 1, required: false, default: null })
  duration?: number | null;

  @Prop({ 
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending' 
  })
  status: string;

  @Prop({ required: true })
  purpose: string;

  @Prop({ required: true, min: 1 })
  numberOfVisitors: number;

  @Prop({ type: String, required: false, default: null })
  notes?: string | null;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);
