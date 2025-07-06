import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

export enum Department {
  Y_TE = 'y_te',
  CHAM_SOC_NGUOI_CAO_TUOI = 'cham_soc_nguoi_cao_tuoi',
  PHUC_HOI_CHUC_NANG = 'phuc_hoi_chuc_nang',
  HOAT_DONG = 'hoat_dong',
  QUAN_LY = 'quan_ly',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ type: [String], enum: Role, default: [Role.FAMILY_MEMBER] })
  roles: Role[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  phoneNumber?: string;

  @Prop()
  address?: string;

  @Prop({ type: String, enum: Department })
  department?: Department;
}

export const UserSchema = SchemaFactory.createForClass(User); 