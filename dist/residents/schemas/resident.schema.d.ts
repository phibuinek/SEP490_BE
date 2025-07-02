import { Document, Schema as MongooseSchema } from 'mongoose';
export type ResidentDocument = Resident & Document;
export declare class Resident {
    full_name: string;
    date_of_birth: Date;
    gender: string;
    avatar: string | null;
    admission_date: Date;
    discharge_date: Date | null;
    family_member_id: MongooseSchema.Types.ObjectId;
    medical_history: string;
    current_medications: {
        medication_name: string;
        dosage: string;
        frequency: string;
    }[];
    allergies: string[];
    emergency_contact: {
        name: string;
        phone: string;
        relationship: string;
    };
    care_level: string;
    status: string;
}
export declare const ResidentSchema: MongooseSchema<Resident, import("mongoose").Model<Resident, any, any, any, Document<unknown, any, Resident, any> & Resident & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Resident, Document<unknown, {}, import("mongoose").FlatRecord<Resident>, {}> & import("mongoose").FlatRecord<Resident> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
