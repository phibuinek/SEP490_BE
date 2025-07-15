import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Activity {
  @Prop({ required: true, name: 'activity_name' })
  activity_name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, name: 'activity_type' })
  activity_type: string;

  @Prop({ required: true, min: 1 })
  duration: number; // Duration in minutes

  @Prop({ required: true, name: 'schedule_time' })
  schedule_time: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, min: 1 })
  capacity: number;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
