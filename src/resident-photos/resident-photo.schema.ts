import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResidentPhotoDocument = ResidentPhoto & Document;

@Schema({ 
  collection: 'resident_photos',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class ResidentPhoto {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  family_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  uploaded_by: Types.ObjectId;

  @Prop({ required: true })
  file_name: string;

  @Prop({ required: true })
  file_path: string;

  @Prop({ required: true })
  file_type: string;

  @Prop({ required: true })
  file_size: number;

  @Prop()
  caption: string;

  @Prop()
  activity_type: string;

  @Prop([String])
  tags: string[];

  @Prop()
  upload_date: Date;

  @Prop()
  taken_date: Date;

  @Prop()
  staff_notes: string;

  @Prop()
  service_start_date: Date;

  @Prop({ type: Types.ObjectId, ref: 'Activity' })
  related_activity_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident' })
  resident_id: Types.ObjectId;
}

export const ResidentPhotoSchema = SchemaFactory.createForClass(ResidentPhoto);
