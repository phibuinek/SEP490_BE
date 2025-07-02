import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  FAMILY = 'family',
}

export enum Relationship {
  SON = 'con trai',
  DAUGHTER = 'con gái',
  GRANDSON = 'cháu trai',
  GRANDDAUGHTER = 'cháu gái',
  SIBLING = 'anh em',
  SPOUSE = 'vợ/chồng',
  OTHER = 'khác',
}

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ required: true, maxlength: 100 })
  full_name: string;

  @Prop({
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  })
  email: string;

  @Prop({ required: true, unique: true, match: /^[0-9]{10,15}$/ })
  phone: string;

  @Prop({
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9_]{3,30}$/,
  })
  username: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ type: String, default: null })
  avatar: string | null;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  // Admin-specific fields
  @Prop({ type: Boolean, default: false })
  is_super_admin?: boolean;

  // Staff-specific fields
  @Prop({ type: String })
  position?: string;

  @Prop({ type: String })
  qualification?: string;

  @Prop({ type: Date })
  join_date?: Date;

  // Family-specific fields
  @Prop({ type: String, enum: Relationship })
  relationship?: Relationship;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Resident' }] })
  residents?: MongooseSchema.Types.ObjectId[];

  @Prop({ type: String })
  address?: string;

  @Prop({ type: String })
  notes?: string;
}

export const UserSchema = SchemaFactory.createForClass(User); 