import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityDocument = Activity & Document;

@Schema({ 
  collection: 'activities',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class Activity {
  @Prop({ required: true })
  activity_name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  activity_type: string;

  @Prop({ required: true, min: 1 })
  duration: number; // Duration in minutes

  @Prop({ required: true })
  schedule_time: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ required: true, type: String })
  staff_id: string;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
