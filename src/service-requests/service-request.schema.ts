import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceRequestDocument = ServiceRequest & Document;

export enum ServiceRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ServiceRequestType {
  CARE_PLAN_CHANGE = 'care_plan_change',
  SERVICE_DATE_CHANGE = 'service_date_change',
  ROOM_CHANGE = 'room_change',
}

@Schema({ collection: 'servicerequests', timestamps: true })
export class ServiceRequest {
  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  family_member_id: Types.ObjectId;

  // Request type to determine which fields are used
  @Prop({ type: String, enum: ServiceRequestType, required: true })
  request_type: ServiceRequestType;

  // For care plan change
  @Prop({ type: Types.ObjectId, ref: 'ServicePackage', default: null })
  target_service_package_id?: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.PENDING,
  })
  status: ServiceRequestStatus;

  @Prop()
  note: string;

  // For date change (extend/adjust service period)
  @Prop({ type: Date, default: null })
  new_start_date?: Date | null;

  @Prop({ type: Date, default: null })
  new_end_date?: Date | null;

  @Prop({ required: true })
  emergencyContactName: string;

  @Prop({ required: true })
  emergencyContactPhone: string;

  @Prop()
  medicalNote: string;

  // For room change
  @Prop({ type: Types.ObjectId, ref: 'Room', default: null })
  target_room_id?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Bed', default: null })
  target_bed_id?: Types.ObjectId | null;
}

export const ServiceRequestSchema =
  SchemaFactory.createForClass(ServiceRequest);
