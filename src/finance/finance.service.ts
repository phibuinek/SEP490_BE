import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from './finance.schema';

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async getTransactions(filter: { fromDate?: string, toDate?: string, type?: string, status?: string }) {
    const query: any = {};
    if (filter.fromDate || filter.toDate) {
      query.date = {};
      if (filter.fromDate) query.date.$gte = new Date(filter.fromDate);
      if (filter.toDate) query.date.$lte = new Date(filter.toDate);
    }
    if (filter.type && filter.type !== 'all') {
      query.type = filter.type;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    return this.transactionModel.find(query).sort({ date: -1 }).exec();
  }
} 