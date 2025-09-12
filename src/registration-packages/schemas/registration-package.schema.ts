import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RegistrationPackageDocument = RegistrationPackage & Document;

export enum RegistrationPackageStatus {
  PENDING = 'pending',       // Chờ duyệt
  ACCEPTED = 'accepted',     // Đã duyệt
  REJECTED = 'rejected',     // Bị từ chối
  ACTIVE = 'active',         // Đã thanh toán và kích hoạt
  CANCELLED = 'cancelled',   // Đã hủy
}

@Schema({
  collection: 'registration_packages',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class RegistrationPackage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  family_member_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CarePlanAssignment', required: true })
  care_plan_assignment_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BedAssignment', required: true })
  bed_assignment_id: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: RegistrationPackageStatus, 
    required: true, 
    default: RegistrationPackageStatus.PENDING 
  })
  status: RegistrationPackageStatus;

  @Prop({ type: String, default: null })
  rejection_reason?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approved_by?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  approved_at?: Date | null;

  @Prop({ type: Date, default: null })
  activated_at?: Date | null;

  @Prop({ type: String, default: null })
  notes?: string | null;

  @Prop({ required: true, default: Date.now })
  created_at: Date;

  @Prop({ required: true, default: Date.now })
  updated_at: Date;
}

export const RegistrationPackageSchema = SchemaFactory.createForClass(RegistrationPackage);
