import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resident, ResidentDocument, ResidentStatus } from './schemas/resident.schema';

@Injectable()
export class ResidentsSchedulerService {
  private readonly logger = new Logger(ResidentsSchedulerService.name);

  constructor(
    @InjectModel(Resident.name)
    private readonly residentModel: Model<ResidentDocument>,
  ) {}

  // Chạy mỗi ngày lúc 00:30: nếu resident vẫn ACTIVE quá 15 ngày kể từ admission_date thì tự động chuyển CANCELLED
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async autoCancelUnadmittedResidents() {
    this.logger.log('Starting auto-cancel check for unadmitted residents...');
    const now = new Date();

    // 15 ngày trước
    const cutoff = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    try {
      const result = await this.residentModel.updateMany(
        {
          status: ResidentStatus.ACTIVE,
          admission_date: { $lte: cutoff },
          is_deleted: false,
        },
        {
          $set: {
            status: ResidentStatus.CANCELLED,
            updated_at: now,
          },
        },
      );

      this.logger.log(`Auto-cancelled ${result.modifiedCount} residents (active > 15 days since admission_date)`);
    } catch (error) {
      this.logger.error('Error running auto-cancel job:', error);
    }
  }
}


