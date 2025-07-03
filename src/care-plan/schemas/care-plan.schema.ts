import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CarePlanDocument = CarePlan & Document;

export enum CarePlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CarePlanPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class CarePlan {
  @Prop({ type: Types.ObjectId, ref: 'Resident', required: true })
  residentId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: String, enum: CarePlanStatus, default: CarePlanStatus.DRAFT })
  status: CarePlanStatus;

  @Prop({ type: String, enum: CarePlanPriority, default: CarePlanPriority.MEDIUM })
  priority: CarePlanPriority;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedTo: Types.ObjectId;

  @Prop([{ 
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
    completedAt: { type: Date },
    completedBy: { type: Types.ObjectId, ref: 'User' }
  }])
  tasks: Array<{
    title: string;
    description?: string;
    completed: boolean;
    dueDate?: Date;
    completedAt?: Date;
    completedBy?: Types.ObjectId;
  }>;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CarePlanSchema = SchemaFactory.createForClass(CarePlan); 