import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BedDocument = Bed & Document;

@Schema({ timestamps: true })
export class Bed {
  @Prop({ required: true, unique: true })
  bedNumber: string;

  @Prop({ required: true })
  roomNumber: string;

  @Prop({ default: false })
  isOccupied: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Resident', default: null })
  residentId: Types.ObjectId | null;
}

export const BedSchema = SchemaFactory.createForClass(Bed); 