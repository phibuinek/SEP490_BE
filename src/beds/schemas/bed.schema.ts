import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BedDocument = Bed & Document;

@Schema({ 
  collection: 'beds',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class Bed {
  @Prop({ required: true, unique: true })
  bed_number: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Room' })
  room_id: Types.ObjectId;

  @Prop({ required: true, enum: ['standard', 'electric', 'medical'] })
  bed_type: string;

  @Prop({ required: true, enum: ['available', 'occupied', 'maintenance'] })
  status: string;
}

export const BedSchema = SchemaFactory.createForClass(Bed);
