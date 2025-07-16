import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
}

export enum BillStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  OVERDUE = 'overdue',
}

@Schema({ 
  collection: 'billings',
  timestamps: true 
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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CarePlan' })
  care_plan_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  care_plan_snapshot: {
    planName: string;
    description: string;
    monthlyPrice: number;
    planType: string;
    category: string;
    staffRatio: string;
  };

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  due_date: Date;

  @Prop()
  paid_date: Date;

  @Prop({
    required: true,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.BANK_TRANSFER,
  })
  payment_method: PaymentMethod;

  @Prop({
    required: true,
    enum: Object.values(BillStatus),
    default: BillStatus.UNPAID,
  })
  status: BillStatus;

  @Prop()
  notes: string;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
