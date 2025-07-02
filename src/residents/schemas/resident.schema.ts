import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ResidentDocument = Resident & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Resident {
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true })
  date_of_birth: Date;

  @Prop({ required: true, enum: ['male', 'female'] })
  gender: string;

  @Prop({ type: String, default: null })
  avatar: string | null;

  @Prop({ required: true })
  admission_date: Date;

  @Prop({ type: Date, default: null })
  discharge_date: Date | null;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  family_member_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  medical_history: string;

  @Prop({
    type: [
      {
        medication_name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
      },
    ],
    default: [],
  })
  current_medications: { medication_name: string; dosage: string; frequency: string }[];

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({
    type: {
      name: { type: String, required: true },
      phone: { type: String, required: true, match: /^[0-9]{10,15}$/ },
      relationship: { type: String, required: true },
    },
    required: true,
  })
  emergency_contact: { name: string; phone: string; relationship: string };

  @Prop({ required: true, enum: ['basic', 'intermediate', 'intensive', 'specialized'] })
  care_level: string;

  @Prop({ required: true, enum: ['active', 'discharged', 'deceased'] })
  status: string;
}

export const ResidentSchema = SchemaFactory.createForClass(Resident); 