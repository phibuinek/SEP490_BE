import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomTypeDocument = RoomType & Document;

@Schema({
  collection: 'room_types',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RoomType {
  @Prop({
    required: true,
    enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'],
  })
  room_type: string;

  @Prop({ required: true })
  type_name: string;

  @Prop({ required: true })
  bed_count: string;

  @Prop({ required: true, min: 0 })
  monthly_price: number;

  @Prop()
  description?: string;

  @Prop({ type: [String] })
  amenities?: string[];

  @Prop({ default: true })
  is_active?: boolean;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
