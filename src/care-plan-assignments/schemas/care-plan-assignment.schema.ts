import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { CarePlanStatus } from '../enums/care-plan-status.enum';

@Schema({ timestamps: true })
export class CarePlanAssignment extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Resident', required: true })
  resident_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  staff_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CarePlan', required: true })
  care_plan_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  care_plan_name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  start_date: Date;

  @Prop()
  end_date: Date;

  @Prop({
    required: true,
    enum: Object.values(CarePlanStatus),
    default: CarePlanStatus.ACTIVE,
  })
  status: CarePlanStatus;
}

export const CarePlanAssignmentSchema =
  SchemaFactory.createForClass(CarePlanAssignment); 