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
exports.ResidentSchema = exports.Resident = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Resident = class Resident {
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
};
exports.Resident = Resident;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Resident.prototype, "full_name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Resident.prototype, "date_of_birth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['male', 'female'] }),
    __metadata("design:type", String)
], Resident.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Resident.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Resident.prototype, "admission_date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Resident.prototype, "discharge_date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: mongoose_2.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], Resident.prototype, "family_member_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Resident.prototype, "medical_history", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                medication_name: { type: String, required: true },
                dosage: { type: String, required: true },
                frequency: { type: String, required: true },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Resident.prototype, "current_medications", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Resident.prototype, "allergies", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            name: { type: String, required: true },
            phone: { type: String, required: true, match: /^[0-9]{10,15}$/ },
            relationship: { type: String, required: true },
        },
        required: true,
    }),
    __metadata("design:type", Object)
], Resident.prototype, "emergency_contact", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['basic', 'intermediate', 'intensive', 'specialized'] }),
    __metadata("design:type", String)
], Resident.prototype, "care_level", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['active', 'discharged', 'deceased'] }),
    __metadata("design:type", String)
], Resident.prototype, "status", void 0);
exports.Resident = Resident = __decorate([
    (0, mongoose_1.Schema)({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
], Resident);
exports.ResidentSchema = mongoose_1.SchemaFactory.createForClass(Resident);
//# sourceMappingURL=resident.schema.js.map