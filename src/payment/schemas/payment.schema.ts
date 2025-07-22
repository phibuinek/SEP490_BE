import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentMethod } from '../../bills/schemas/bill.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Bill', required: true })
  bill_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({
    required: true,
    enum: Object.values(PaymentMethod),
  })
  payment_method: PaymentMethod;

  @Prop({ required: true, unique: true })
  transaction_id: string; // ID giao dịch từ cổng thanh toán hoặc mã giao dịch nội bộ

  @Prop({ default: 'succeeded' })
  status: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
