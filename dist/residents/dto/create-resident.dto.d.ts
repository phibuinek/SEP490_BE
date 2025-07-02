declare class EmergencyContactDto {
    name: string;
    phone: string;
    relationship: string;
}
declare class MedicationDto {
    medication_name: string;
    dosage: string;
    frequency: string;
}
export declare class CreateResidentDto {
    full_name: string;
    date_of_birth: string;
    gender: string;
    avatar?: string;
    admission_date: string;
    discharge_date?: string;
    family_member_id: string;
    medical_history: string;
    current_medications?: MedicationDto[];
    allergies?: string[];
    emergency_contact: EmergencyContactDto;
    care_level: string;
    status: string;
}
export {};
