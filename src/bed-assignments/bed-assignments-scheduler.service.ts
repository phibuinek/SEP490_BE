import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BedAssignment,
  BedAssignmentDocument,
} from './schemas/bed-assignment.schema';

@Injectable()
export class BedAssignmentsSchedulerService {
  private readonly logger = new Logger(
    BedAssignmentsSchedulerService.name,
  );

  constructor(
    @InjectModel(BedAssignment.name)
    private bedAssignmentModel: Model<BedAssignmentDocument>,
  ) {}

  /**
   * Check for accepted bed assignments that should become active at the start of new month
   * and active bed assignments that should become done at the end of current month
   * Runs on the 1st day of every month at 00:00
   */
  @Cron('0 0 1 * *', {
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async checkAndActivateAcceptedBedAssignments() {
    this.logger.log(
      'Starting monthly check for accepted bed assignments to activate and active bed assignments to finalize...',
    );

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      // 1. Find all accepted bed assignments that should become active (assigned_date <= start of current month)
      const acceptedAssignments = await this.bedAssignmentModel
        .find({
          status: 'accepted',
          assigned_date: {
            $lte: startOfMonth,
          },
        })
        .populate('resident_id', 'full_name')
        .exec();

      this.logger.log(`Found ${acceptedAssignments.length} accepted bed assignments to activate`);

      if (acceptedAssignments.length > 0) {
        // Update accepted bed assignments to active
        const result = await this.bedAssignmentModel.updateMany(
          {
            status: 'accepted',
            assigned_date: {
              $lte: startOfMonth,
            },
          },
          {
            $set: {
              status: 'active',
              updated_at: now,
            },
          },
        );

        this.logger.log(
          `Successfully activated ${result.modifiedCount} accepted bed assignments`,
        );

        // Log details of each activated assignment
        acceptedAssignments.forEach((assignment) => {
          const residentName = (assignment.resident_id as any)?.full_name || 'Unknown';
          this.logger.log(
            `Activated bed assignment ID: ${assignment._id}, Resident: ${residentName}, Assigned Date: ${assignment.assigned_date}`,
          );
        });
      }

      // 2. Find all active bed assignments that should become done (unassigned_date <= end of previous month)
      const activeAssignments = await this.bedAssignmentModel
        .find({
          status: 'active',
          unassigned_date: {
            $lte: endOfPreviousMonth,
            $ne: null,
          },
        })
        .populate('resident_id', 'full_name')
        .exec();

      this.logger.log(`Found ${activeAssignments.length} active bed assignments to finalize`);

      if (activeAssignments.length > 0) {
        // Update active bed assignments to done
        const result = await this.bedAssignmentModel.updateMany(
          {
            status: 'active',
            unassigned_date: {
              $lte: endOfPreviousMonth,
              $ne: null,
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
          `Successfully finalized ${result.modifiedCount} active bed assignments`,
        );

        // Log details of each finalized assignment
        activeAssignments.forEach((assignment) => {
          const residentName = (assignment.resident_id as any)?.full_name || 'Unknown';
          this.logger.log(
            `Finalized bed assignment ID: ${assignment._id}, Resident: ${residentName}, Unassigned Date: ${assignment.unassigned_date}`,
          );
        });
      }

      this.logger.log('Monthly bed assignment status transition completed successfully');
    } catch (error) {
      this.logger.error('Error during monthly bed assignment status transition:', error);
    }
  }

  /**
   * Manual trigger for testing monthly bed assignment status transitions
   */
  async manualCheckMonthlyBedTransitions() {
    this.logger.log(
      'Manual trigger: Checking for monthly bed assignment status transitions...',
    );
    await this.checkAndActivateAcceptedBedAssignments();
  }
}
