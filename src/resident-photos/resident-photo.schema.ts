import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResidentPhotoDocument = ResidentPhoto & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ResidentPhoto {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, name: 'family_id' })
  familyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, name: 'uploaded_by' })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true, name: 'file_name' })
  fileName: string;

  @Prop({ required: true, name: 'file_path' })
  filePath: string;

  @Prop({ required: true, name: 'file_type' })
  fileType: string;

  @Prop({ required: true, name: 'file_size' })
  fileSize: number;

  @Prop()
  caption: string;

  @Prop({ name: 'activity_type' })
  activityType: string;

  @Prop([String])
  tags: string[];

  @Prop({ name: 'upload_date' })
  uploadDate: Date;

  @Prop({ name: 'taken_date' })
  takenDate: Date;

  @Prop({ name: 'staff_notes' })
  staffNotes: string;

  @Prop({ name: 'service_start_date' })
  serviceStartDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Activity', name: 'related_activity_id' })
  relatedActivityId: Types.ObjectId;
}

export const ResidentPhotoSchema = SchemaFactory.createForClass(ResidentPhoto); 