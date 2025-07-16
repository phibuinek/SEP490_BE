import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceRequestDocument = ServiceRequest & Document;

export enum ServiceRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ collection: 'servicerequests', timestamps: true })
export class ServiceRequest {
  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  resident_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  family_member_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServicePackage', required: true })
  service_package_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.PENDING,
  })
  status: ServiceRequestStatus;

  @Prop()
  note: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  emergencyContactName: string;

  @Prop({ required: true })
  emergencyContactPhone: string;

  @Prop()
  medicalNote: string;
}

export const ServiceRequestSchema =
  SchemaFactory.createForClass(ServiceRequest);
