import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PlanType {
  CHAM_SOC_DAC_BIET = 'cham_soc_dac_biet',
  CHAM_SOC_TICH_CUC = 'cham_soc_tich_cuc',
  CHAM_SOC_TIEU_CHUAN = 'cham_soc_tieu_chuan',
  CHAM_SOC_SA_SUT_TRI_TUE = 'cham_soc_sa_sut_tri_tue',
  PHUC_HOI_CHUC_NANG = 'phuc_hoi_chuc_nang',
  CHAM_SOC_GIAM_NHE = 'cham_soc_giam_nhe',
  CHAM_SOC_HAU_PHAU_THUAT = 'cham_soc_hau_phau_thuat',
  CHAM_SOC_TIEU_DUONG = 'cham_soc_tieu_duong',
  VAT_LY_TRI_LIEU = 'vat_ly_tri_lieu',
  TRI_LIEU_NGHE_NGHIEP = 'tri_lieu_nghe_nghiep',
  HO_TRO_DINH_DUONG = 'ho_tro_dinh_duong',
  CHAM_SOC_VET_THUONG = 'cham_soc_vet_thuong',
  KHAC = 'khác',
}

export enum CategoryType {
  MAIN = 'main',
  SUPPLEMENTARY = 'supplementary',
}

export enum DurationType {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
  DAILY = 'daily',
  ONE_TIME = 'one_time',
}

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'care_plans',
})
export class CarePlan {
  @Prop({ required: true })
  plan_name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  monthly_price: number;

  @Prop({ required: true, enum: Object.values(PlanType) })
  plan_type: PlanType;

  @Prop({ required: true, enum: Object.values(CategoryType) })
  category: CategoryType;

  @Prop({ type: [String], required: true })
  services_included: string[];

  @Prop({
    type: [
      {
        medication_id: {
          type: Types.ObjectId,
          ref: 'Medication',
          required: true,
        },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        _id: false, // Không sinh _id phụ cho từng phần tử
      },
    ],
    default: null,
    required: false,
  })
  default_medications: Array<{
    medication_id: Types.ObjectId;
    dosage: string;
    frequency: string;
  }> | null;

  @Prop({ type: [String], default: null })
  prerequisites: (string | null)[] | null;

  @Prop({ type: [String], default: null })
  contraindications: (string | null)[] | null;

  @Prop({ type: String, required: false, default: null })
  staff_ratio: string | null;

  @Prop({
    required: true,
    enum: Object.values(DurationType),
  })
  duration_type: DurationType;

  @Prop({ default: true })
  is_active: boolean;

  _id?: Types.ObjectId;
}

export type CarePlanDocument = CarePlan & Document;

export const CarePlanSchema = SchemaFactory.createForClass(CarePlan);
