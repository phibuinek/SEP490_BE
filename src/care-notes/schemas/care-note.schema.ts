import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssessmentDocument = Assessment & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Assessment {
  @Prop({ type: String, required: false, default: null })
  assessment_type: string | null;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop()
  notes: string;

  @Prop({ type: String, required: false, default: null })
  recommendations: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  conducted_by: Types.ObjectId;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment); 