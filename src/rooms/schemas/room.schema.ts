import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomDocument = Room & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Room {
  @Prop({ required: true })
  room_number: string;

  @Prop({ required: true, enum: [2, 3, 4, 5, 6, 7, 8] })
  bed_count: number;

  @Prop({ required: true, enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'] })
  room_type: string;

  @Prop({ required: true, enum: ['male', 'female'] })
  gender: string;

  @Prop({ required: true, min: 1 })
  floor: number;

  @Prop({ required: true, type: Types.ObjectId, ref: 'CarePlan' })
  main_care_plan_id: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
  })
  status: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
