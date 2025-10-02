import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CarePlanAssignment,
  CarePlanAssignmentDocument,
} from './schemas/care-plan-assignment.schema';

@Injectable()
export class CarePlanAssignmentsSchedulerService {
  private readonly logger = new Logger(
    CarePlanAssignmentsSchedulerService.name,
  );

  constructor(
    @InjectModel(CarePlanAssignment.name)
    private carePlanAssignmentModel: Model<CarePlanAssignmentDocument>,
  ) {}

  /**
   * Check for expired care plan assignments and automatically pause them
   * Runs every day at 00:00 (midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async checkAndPauseExpiredAssignments() {
    this.logger.log(
      'Starting automatic check for expired care plan assignments...',
    );

    try {
      const now = new Date();

      // Find all active assignments that have expired
      const expiredAssignments = await this.carePlanAssignmentModel
        .find({
          status: 'active',
          end_date: {
            $lt: now,
            $ne: null,
          },
        })
        .exec();

      this.logger.log(`Found ${expiredAssignments.length} expired assignments`);

      if (expiredAssignments.length > 0) {
        // Update all expired assignments to paused status
        const result = await this.carePlanAssignmentModel.updateMany(
          {
            status: 'active',
            end_date: {
              $lt: now,
              $ne: null,
            },
          },
          {
            $set: {
              status: 'paused',
              updated_at: now,
            },
          },
        );

        this.logger.log(
          `Successfully paused ${result.modifiedCount} expired assignments`,
        );

        // Log details of each expired assignment
        expiredAssignments.forEach((assignment) => {
          this.logger.log(
            `Paused assignment ID: ${assignment._id}, Resident: ${assignment.resident_id}, End Date: ${assignment.end_date}`,
          );
        });
      } else {
        this.logger.log('No expired assignments found');
      }
    } catch (error) {
      this.logger.error('Error checking for expired assignments:', error);
    }
  }

  /**
   * Check for assignments that will expire soon (within 7 days) and log them
   * Runs every day at 06:00 AM
   */
  @Cron('0 6 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }) // Every day at 6:00 AM
  async checkUpcomingExpirations() {
    this.logger.log('Checking for assignments that will expire soon...');

    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000,
      );

      // Find active assignments that will expire within 7 days
      const upcomingExpirations = await this.carePlanAssignmentModel
        .find({
          status: 'active',
          end_date: {
            $gte: now,
            $lte: sevenDaysFromNow,
            $ne: null,
          },
        })
        .populate('resident_id', 'full_name')
        .exec();

      this.logger.log(
        `Found ${upcomingExpirations.length} assignments expiring within 7 days`,
      );

      upcomingExpirations.forEach((assignment) => {
        const daysUntilExpiration = Math.ceil(
          ((assignment.end_date as Date).getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000),
        );
        const residentName =
          (assignment.resident_id as any)?.full_name || 'Unknown';
        this.logger.log(
          `Assignment ID: ${assignment._id}, Resident: ${residentName}, Expires in ${daysUntilExpiration} days`,
        );
      });
    } catch (error) {
      this.logger.error('Error checking for upcoming expirations:', error);
    }
  }

  /**
   * Check for paused assignments that have been paused for more than 5 days and mark them as done
   * Runs every day at 01:00 AM (1 hour after the expiration check)
   */
  @Cron('0 1 * * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async checkAndFinalizePausedAssignments() {
    this.logger.log(
      'Starting automatic check for paused care plan assignments that should be marked as done...',
    );

    try {
      const now = new Date();
      // Calculate 5 days ago from now
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      // Find all paused assignments that have been paused for more than 5 days
      // We check updated_at because that's when the status was changed to 'paused'
      const pausedAssignments = await this.carePlanAssignmentModel
        .find({
          status: 'paused',
          updated_at: {
            $lt: fiveDaysAgo,
          },
        })
        .populate('resident_id', 'full_name')
        .exec();

      this.logger.log(`Found ${pausedAssignments.length} paused assignments that should be finalized`);

      if (pausedAssignments.length > 0) {
        // Update all qualifying paused assignments to done status
        const result = await this.carePlanAssignmentModel.updateMany(
          {
            status: 'paused',
            updated_at: {
              $lt: fiveDaysAgo,
            },
          },
          {
            $set: {
              status: 'done',
              updated_at: now,
            },
          },
        );

        this.logger.log(
          `Successfully marked ${result.modifiedCount} paused assignments as done`,
        );

        // Log details of each finalized assignment
        pausedAssignments.forEach((assignment) => {
          const residentName = (assignment.resident_id as any)?.full_name || 'Unknown';
          const daysPaused = Math.floor(
            (now.getTime() - (assignment.updated_at as Date).getTime()) / (24 * 60 * 60 * 1000)
          );
          this.logger.log(
            `Finalized assignment ID: ${assignment._id}, Resident: ${residentName}, Days paused: ${daysPaused}, End Date: ${assignment.end_date}`,
          );
        });
      } else {
        this.logger.log('No paused assignments found that need to be finalized');
      }
    } catch (error) {
      this.logger.error('Error checking for paused assignments to finalize:', error);
    }
  }

  /**
   * Manual trigger for testing purposes
   */
  async manualCheckExpiredAssignments() {
    this.logger.log(
      'Manual trigger: Starting check for expired care plan assignments...',
    );
    await this.checkAndPauseExpiredAssignments();
  }

  /**
   * Manual trigger for testing upcoming expirations
   */
  async manualCheckUpcomingExpirations() {
    this.logger.log(
      'Manual trigger: Checking for assignments that will expire soon...',
    );
    await this.checkUpcomingExpirations();
  }

  /**
   * Manual trigger for testing paused assignments finalization
   */
  async manualCheckPausedAssignments() {
    this.logger.log(
      'Manual trigger: Checking for paused assignments that should be finalized...',
    );
    await this.checkAndFinalizePausedAssignments();
  }
}
