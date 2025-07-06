import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Visit extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  family_member_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ required: true })
  visit_time: string;

  @Prop({ required: true })
  visit_date: Date;

  @Prop({ required: true })
  duration: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  purpose: string;

  @Prop()
  numberOfVisitors: number;
}

export const VisitSchema = SchemaFactory.createForClass(Visit); 