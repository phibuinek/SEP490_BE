import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  date: Date;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: TransactionStatus, required: true })
  status: TransactionStatus;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction); 