import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoomTypeDocument = RoomType & Document;

@Schema({ timestamps: true })
export class RoomType {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop([String])
  amenities: string[];

  @Prop()
  image?: string;
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType); 