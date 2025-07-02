import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ResidentDocument = Resident & Document;

@Schema({ timestamps: true })
export class Resident {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, enum: ['Male', 'Female', 'Other'] })
  gender: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop()
  healthStatus: string;

  @Prop()
  allergies: string[];

  @Prop()
  medicalHistory: string;

  @Prop({ type: [Types.ObjectId], ref: 'User' })
  familyIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Bed', default: null })
  bedId: Types.ObjectId | null;
}

export const ResidentSchema = SchemaFactory.createForClass(Resident); 