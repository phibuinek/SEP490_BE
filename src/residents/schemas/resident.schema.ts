import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Sub-schema for current medications
@Schema({ _id: false })
export class Medication {
  @Prop({ required: true })
  medication_name: string;

  @Prop({ required: true })
  dosage: string;

  @Prop({ required: true })
  frequency: string;
}
export const MedicationSchema = SchemaFactory.createForClass(Medication);

// Sub-schema for emergency contact
@Schema({ _id: false })
export class EmergencyContact {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, match: /^[0-9]{10,15}$/ })
  phone: string;

  @Prop({ required: true, enum: [
    'con trai',
    'con gái',
    'cháu trai',
    'cháu gái',
    'anh em',
    'vợ/chồng',
    'khác',
  ] })
  relationship: string;
}
export const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);

export type ResidentDocument = Resident & Document;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum CareLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  INTENSIVE = 'intensive',
  SPECIALIZED = 'specialized',
}

export enum ResidentStatus {
  ACTIVE = 'active',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'residents',
})
export class Resident {
  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true })
  date_of_birth: Date;

  @Prop({ type: String, enum: Gender, required: true })
  gender: Gender;

  @Prop({ type: [String, null], default: null })
  avatar?: string | null;

  @Prop({ required: true })
  admission_date: Date;

  @Prop({ type: Date, default: null })
  discharge_date?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  family_member_id: Types.ObjectId;

  @Prop({ required: true, enum: [
    'con trai',
    'con gái',
    'cháu trai',
    'cháu gái',
    'anh em',
    'vợ/chồng',
    'khác',
  ] })
  relationship: string;

  @Prop({ required: true })
  medical_history: string;

  @Prop({ type: [MedicationSchema], required: true })
  current_medications: Medication[];

  @Prop({ type: [String], required: true })
  allergies: string[];

  @Prop({ type: EmergencyContactSchema, required: true })
  emergency_contact: EmergencyContact;

  @Prop({ type: String, enum: CareLevel, required: true })
  care_level: CareLevel;

  @Prop({ type: String, enum: ResidentStatus, required: true })
  status: ResidentStatus;

  @Prop({ required: true })
  created_at: Date;

  @Prop({ required: true })
  updated_at: Date;
}

export const ResidentSchema = SchemaFactory.createForClass(Resident);
