import { IsDateString, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Schema } from 'mongoose';

export class CreateBillDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly family_member_id: Schema.Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  readonly resident_id: Schema.Types.ObjectId;
  
  @IsMongoId()
  @IsNotEmpty()
  readonly care_plan_id: Schema.Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  readonly staff_id: Schema.Types.ObjectId;

  @IsDateString()
  @IsNotEmpty()
  readonly due_date: Date;

  @IsString()
  @IsOptional()
  readonly notes: string;
} 