import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Sub-schema for Emergency Contact
@Schema({ _id: false })
export class EmergencyContact {
  @Prop({ required: true, name: 'full_name' })
  fullName: string;

  @Prop({ required: true })
  relationship: string;

  @Prop({ required: true, name: 'phone_number' })
  phoneNumber: string;
}
export const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);

export type ResidentDocument = Resident & Document;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum CareLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  SPECIALIZED = 'specialized',
}

export enum ResidentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCHARGED = 'discharged',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'residents' })
export class Resident {
  @Prop({ required: true, name: 'full_name' })
  fullName: string;

  @Prop({ required: true, name: 'date_of_birth' })
  dateOfBirth: Date;

  @Prop({ type: String, enum: Gender, required: true })
  gender: Gender;

  @Prop({ required: true, name: 'admission_date' })
  admissionDate: Date;

  @Prop({ type: Date, default: null, name: 'discharge_date' })
  dischargeDate: Date | null;

  @Prop({ type: String, name: 'family_member_id' })
  familyMemberId: string;

  @Prop({ name: 'medical_history' })
  medicalHistory: string;

  @Prop({ type: [String], name: 'current_medications' })
  currentMedications: string[];

  @Prop([String])
  allergies: string[];

  @Prop({ type: EmergencyContactSchema, name: 'emergency_contact' })
  emergencyContact: EmergencyContact;

  @Prop({ type: String, enum: CareLevel, required: true, name: 'care_level' })
  careLevel: CareLevel;

  @Prop({ type: String, enum: ResidentStatus, default: ResidentStatus.ACTIVE })
  status: ResidentStatus;

  @Prop({ type: [Types.ObjectId], ref: 'CarePlan', name: 'care_plan_ids' })
  carePlanIds?: Types.ObjectId[];
}

export const ResidentSchema = SchemaFactory.createForClass(Resident); 