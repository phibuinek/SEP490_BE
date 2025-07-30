import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum PaymentMethod {
  QR_PAYMENT = 'qr_payment',
}

export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Schema({ 
  collection: 'billings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
})
export class Bill extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  family_member_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Resident' })
  resident_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CarePlanAssignment' })
  care_plan_assignment_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  staff_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  care_plan_snapshot: {
    plan_name: string;
    description: string;
    monthly_price: number;
    plan_type: string;
    category: string;
    staff_ratio: string;
  };

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  due_date: Date;

  @Prop()
  paid_date: Date;

  @Prop({
    required: true,
    enum: [PaymentMethod.QR_PAYMENT],
    default: PaymentMethod.QR_PAYMENT,
  })
  payment_method: PaymentMethod;

  @Prop({
    required: true,
    enum: [BillStatus.PENDING, BillStatus.PAID, BillStatus.OVERDUE, BillStatus.CANCELLED],
    default: BillStatus.PENDING,
  })
  status: BillStatus;

  @Prop()
  notes: string;

  @Prop()
  order_code: string;

  @Prop()
  payment_link_id: string;

  @Prop({ required: true })
  title: string;
}

export const BillSchema = SchemaFactory.createForClass(Bill);