import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  FAMILY = 'family',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'users',
})
export class User {
  @Prop({ required: true, minlength: 1, maxlength: 100 })
  full_name: string;

  @Prop({
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  })
  email: string;

  @Prop({ required: true, match: /^[0-9]{10,15}$/ })
  phone: string;

  @Prop({ required: true, unique: true, match: /^[a-zA-Z0-9_]{3,30}$/ })
  username: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ type: String, default: null })
  avatar?: string | null;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ required: true, enum: UserStatus })
  status: UserStatus;

  @Prop({ type: Boolean, default: false })
  is_super_admin?: boolean;

  @Prop()
  position?: string;

  @Prop()
  qualification?: string;

  @Prop()
  join_date?: Date;

  @Prop()
  address?: string;

  @Prop()
  notes?: string;

  // created_at and updated_at are automatically managed by timestamps
  created_at?: Date;
  updated_at?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
