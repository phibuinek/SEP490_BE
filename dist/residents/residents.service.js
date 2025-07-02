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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResidentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const resident_schema_1 = require("./schemas/resident.schema");
const users_service_1 = require("../users/users.service");
const user_schema_1 = require("../users/schemas/user.schema");
let ResidentsService = class ResidentsService {
    residentModel;
    usersService;
    constructor(residentModel, usersService) {
        this.residentModel = residentModel;
        this.usersService = usersService;
    }
    async create(createResidentDto) {
        const { family_member_id } = createResidentDto;
        const familyMember = await this.usersService.findOne(family_member_id);
        if (!familyMember || familyMember.role !== user_schema_1.UserRole.FAMILY) {
            throw new common_1.BadRequestException('Invalid family member ID or user is not a family member.');
        }
        const createdResident = new this.residentModel(createResidentDto);
        await createdResident.save();
        const newResidentId = createdResident._id.toString();
        const currentResidentIds = familyMember.residents?.map(id => id.toString()) || [];
        if (!currentResidentIds.includes(newResidentId)) {
            const updatedResidentIds = [...currentResidentIds, newResidentId];
            await this.usersService.update(family_member_id, { residents: updatedResidentIds });
        }
        return createdResident;
    }
    async findAll() {
        return this.residentModel.find().exec();
    }
    async findOne(id) {
        const resident = await this.residentModel.findById(id).exec();
        if (!resident) {
            throw new common_1.NotFoundException(`Resident with ID ${id} not found`);
        }
        return resident;
    }
    async update(id, updateResidentDto) {
        const updatedResident = await this.residentModel.findByIdAndUpdate(id, updateResidentDto, { new: true });
        if (!updatedResident) {
            throw new common_1.NotFoundException(`Resident with ID ${id} not found`);
        }
        return updatedResident;
    }
    async remove(id) {
        const result = await this.residentModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException(`Resident with ID ${id} not found`);
        }
        return { deleted: true, id };
    }
};
exports.ResidentsService = ResidentsService;
exports.ResidentsService = ResidentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(resident_schema_1.Resident.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService])
], ResidentsService);
//# sourceMappingURL=residents.service.js.map