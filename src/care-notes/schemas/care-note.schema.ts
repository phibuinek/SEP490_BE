import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CareNoteDocument = CareNote & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class CareNote {
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  staffId: Types.ObjectId;

  @Prop({ required: true })
  staffName: string;

  @Prop({ required: true })
  staffRole: string;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  residentId: Types.ObjectId;
}

export const CareNoteSchema = SchemaFactory.createForClass(CareNote); 