import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class CarePlan {
  @Prop({ required: true, name: 'plan_name' })
  planName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, name: 'monthly_price' })
  monthlyPrice: number;

  @Prop({ required: true, name: 'plan_type' })
  planType: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: [String], name: 'services_included' })
  servicesIncluded: string[];

  @Prop({ required: true, name: 'staff_ratio' })
  staffRatio: string;

  @Prop({ required: true, name: 'duration_type' })
  durationType: string;

  @Prop({ type: [String], name: 'default_medications' })
  defaultMedications: string[];

  @Prop({ type: [String] })
  prerequisites: string[];

  @Prop({ type: [String] })
  contraindications: string[];

  @Prop({ default: true, name: 'is_active' })
  isActive: boolean;

  // 👇 Thêm vào đây để tránh lỗi khi truy cập careplan._id
  _id?: Types.ObjectId;
}

export type CarePlanDocument = CarePlan & Document;

export const CarePlanSchema = SchemaFactory.createForClass(CarePlan);
