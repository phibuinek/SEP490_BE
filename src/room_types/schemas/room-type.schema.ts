import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomTypeDocument = RoomType & Document;

@Schema({ 
  collection: 'room_types',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class RoomType {
  @Prop({
    required: true,
    enum: ['2_bed', '3_bed', '4_5_bed', '6_8_bed'],
    name: 'room_type',
  })
  room_type: string;

  @Prop({ required: true, name: 'type_name' })
  type_name: string;

  @Prop({ required: true, name: 'bed_count' })
  bed_count: string;

  @Prop({ required: true, min: 0, name: 'monthly_price' })
  monthly_price: number;

  @Prop({ name: 'description' })
  description?: string;

  @Prop({ type: [String], name: 'amenities' })
  amenities?: string[];

  @Prop({ name: 'is_active', default: true })
  is_active?: boolean;

  @Prop({ name: 'created_at' })
  created_at?: Date;

  @Prop({ name: 'updated_at' })
  updated_at?: Date;
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
