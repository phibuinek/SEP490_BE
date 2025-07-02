"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateResidentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class EmergencyContactDto {
    name;
    phone;
    relationship;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nguyễn Thị Hoa' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmergencyContactDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0912345678' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmergencyContactDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'con gái' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmergencyContactDto.prototype, "relationship", void 0);
class MedicationDto {
    medication_name;
    dosage;
    frequency;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Metformin' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "medication_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '500mg' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "dosage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2 lần/ngày' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicationDto.prototype, "frequency", void 0);
class CreateResidentDto {
    full_name;
    date_of_birth;
    gender;
    avatar;
    admission_date;
    discharge_date;
    family_member_id;
    medical_history;
    current_medications;
    allergies;
    emergency_contact;
    care_level;
    status;
}
exports.CreateResidentDto = CreateResidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nguyễn Văn Nam' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "full_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1950-05-15' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "date_of_birth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['male', 'female'], example: 'male' }),
    (0, class_validator_1.IsEnum)(['male', 'female']),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-10' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "admission_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2025-01-10' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "discharge_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID của người thân (user có role family)', example: '60d...' }),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "family_member_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cao huyết áp, tiểu đường type 2' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "medical_history", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [MedicationDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicationDto),
    __metadata("design:type", Array)
], CreateResidentDto.prototype, "current_medications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Penicillin'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateResidentDto.prototype, "allergies", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: EmergencyContactDto }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EmergencyContactDto),
    __metadata("design:type", EmergencyContactDto)
], CreateResidentDto.prototype, "emergency_contact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['basic', 'intermediate', 'intensive', 'specialized'], example: 'intermediate' }),
    (0, class_validator_1.IsEnum)(['basic', 'intermediate', 'intensive', 'specialized']),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "care_level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['active', 'discharged', 'deceased'], example: 'active' }),
    (0, class_validator_1.IsEnum)(['active', 'discharged', 'deceased']),
    __metadata("design:type", String)
], CreateResidentDto.prototype, "status", void 0);
//# sourceMappingURL=create-resident.dto.js.map