import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Resident, ResidentDocument } from '../residents/schemas/resident.schema';
import { CarePlanAssignment, CarePlanAssignmentDocument } from '../care-plan-assignments/schemas/care-plan-assignment.schema';

export class DatabaseIndexes {
  static async createUserIndexes(userModel: Model<UserDocument>): Promise<void> {
    try {
      // Create indexes using collection method
      const collection = userModel.collection;
      await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
      await collection.createIndex({ username: 1 }, { unique: true, sparse: true });
      await collection.createIndex({ role: 1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ created_at: -1 });
      await collection.createIndex({ phone: 1 });
      await collection.createIndex({ role: 1, status: 1 });
      await collection.createIndex({ role: 1, created_at: -1 });
      
      console.log('✅ User indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating User indexes:', error);
    }
  }

  static async createResidentIndexes(residentModel: Model<ResidentDocument>): Promise<void> {
    try {
      const collection = residentModel.collection;
      await collection.createIndex({ family_member_id: 1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ created_at: -1 });
      await collection.createIndex({ is_deleted: 1 });
      await collection.createIndex({ cccd_id: 1 });
      await collection.createIndex({ family_member_id: 1, status: 1 });
      await collection.createIndex({ status: 1, is_deleted: 1 });
      await collection.createIndex({ family_member_id: 1, is_deleted: 1 });
      await collection.createIndex({ status: 1, created_at: -1 });
      await collection.createIndex({ full_name: 'text', cccd_id: 'text', medical_history: 'text' });
      
      console.log('✅ Resident indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating Resident indexes:', error);
    }
  }

  static async createCarePlanAssignmentIndexes(assignmentModel: Model<CarePlanAssignmentDocument>): Promise<void> {
    try {
      const collection = assignmentModel.collection;
      await collection.createIndex({ resident_id: 1 });
      await collection.createIndex({ family_member_id: 1 });
      await collection.createIndex({ staff_id: 1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ created_at: -1 });
      await collection.createIndex({ start_date: 1 });
      await collection.createIndex({ end_date: 1 });
      await collection.createIndex({ resident_id: 1, status: 1 });
      await collection.createIndex({ family_member_id: 1, status: 1 });
      await collection.createIndex({ status: 1, created_at: -1 });
      await collection.createIndex({ start_date: 1, end_date: 1 });
      await collection.createIndex({ end_date: 1 }, { 
        expireAfterSeconds: 0, // Manual cleanup
        partialFilterExpression: { status: { $in: ['completed', 'cancelled'] } }
      });
      
      console.log('✅ CarePlanAssignment indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating CarePlanAssignment indexes:', error);
    }
  }

  static async createAllIndexes(
    userModel: Model<UserDocument>,
    residentModel: Model<ResidentDocument>,
    assignmentModel: Model<CarePlanAssignmentDocument>
  ): Promise<void> {
    console.log('🚀 Creating database indexes...');
    
    await Promise.all([
      this.createUserIndexes(userModel),
      this.createResidentIndexes(residentModel),
      this.createCarePlanAssignmentIndexes(assignmentModel),
    ]);
    
    console.log('✅ All database indexes created successfully');
  }
}