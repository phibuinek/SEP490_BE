import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'otps',
})
export class Otp {
  @Prop({ required: true, match: /^[0-9]{10,15}$/ })
  phone: string;

  @Prop({ required: true, match: /^[0-9]{6}$/ })
  otp: string;

  @Prop({ required: true, default: Date.now, expires: 300 }) // 5 minutes expiry
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop({ default: 0 })
  attemptCount: number;

  // created_at and updated_at are automatically managed by timestamps
  created_at?: Date;
  updated_at?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);






