import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export interface IMessage extends Document {
  id: string;
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({ required: true, enum: ['read', 'unread'], default: 'unread' })
  status: string;

  @Prop({ type: String, required: false })
  attachment?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: false })
  resident_id?: Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for better query performance
MessageSchema.index({ sender_id: 1, receiver_id: 1 });
MessageSchema.index({ timestamp: -1 });
MessageSchema.index({ resident_id: 1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ receiver_id: 1, status: 1 }); // For unread messages
