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
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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
  @Cron('0 6 * * *') // Every day at 6:00 AM
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
}
