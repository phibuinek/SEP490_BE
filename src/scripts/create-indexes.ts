import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DatabaseIndexes } from '../database/indexes';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Resident } from '../residents/schemas/resident.schema';
import { CarePlanAssignment } from '../care-plan-assignments/schemas/care-plan-assignment.schema';

async function createIndexes() {
  console.log('🚀 Starting database index creation...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get models
    const userModel = app.get(getModelToken(User.name));
    const residentModel = app.get(getModelToken(Resident.name));
    const assignmentModel = app.get(getModelToken(CarePlanAssignment.name));
    
    // Create all indexes
    await DatabaseIndexes.createAllIndexes(userModel, residentModel, assignmentModel);
    
    console.log('✅ Database indexes created successfully!');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  createIndexes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { createIndexes };

