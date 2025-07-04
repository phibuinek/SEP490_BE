import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BedDocument = Bed & Document;

export enum BedStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Bed {
  @Prop({ required: true, unique: true, name: 'bed_number' })
  bedNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true, name: 'room_id' })
  roomId: Types.ObjectId;

  @Prop({ required: true, name: 'bed_type', default: 'standard' })
  bedType: string;

  @Prop({ type: String, enum: BedStatus, default: BedStatus.AVAILABLE })
  status: BedStatus;

  @Prop({ type: Types.ObjectId, ref: 'Resident', default: null, name: 'resident_id' })
  residentId: Types.ObjectId | null;
}

export const BedSchema = SchemaFactory.createForClass(Bed); 