import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssessmentDocument = Assessment & Document;

@Schema({
  collection: 'assessments',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  strict: false, // Allow additional fields
})
export class Assessment {
  @Prop({ type: String, required: false, default: null })
  assessment_type: string | null;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: false, default: null })
  notes: string | null;

  @Prop({ type: String, required: false, default: null })
  recommendations: string | null;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  conducted_by: Types.ObjectId | null;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);

// Add custom validation
AssessmentSchema.pre('save', function (next) {
  // Ensure resident_id is ObjectId
  if (this.resident_id && typeof this.resident_id === 'string') {
    this.resident_id = new Types.ObjectId(this.resident_id);
  }

  // Ensure conducted_by is ObjectId if provided
  if (this.conducted_by && typeof this.conducted_by === 'string') {
    this.conducted_by = new Types.ObjectId(this.conducted_by);
  }

  next();
});
