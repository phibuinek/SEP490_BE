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
exports.DatabaseSeeder = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcryptjs");
const user_schema_1 = require("../users/schemas/user.schema");
let DatabaseSeeder = class DatabaseSeeder {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async onModuleInit() {
        await this.seedUsers();
    }
    async seedUsers() {
        const adminExists = await this.userModel.findOne({ role: user_schema_1.UserRole.ADMIN });
        if (adminExists) {
            console.log('Admin user already exists, skipping seeding...');
            return;
        }
        const users = [
            {
                username: 'admin',
                email: 'admin@example.com',
                phone: '0000000000',
                password: await bcrypt.hash('admin123', 10),
                full_name: 'System Administrator',
                role: user_schema_1.UserRole.ADMIN,
                is_super_admin: true,
            },
            {
                username: 'staff1',
                email: 'staff@example.com',
                phone: '0000000001',
                password: await bcrypt.hash('staff123', 10),
                full_name: 'Staff Member',
                role: user_schema_1.UserRole.STAFF,
                position: 'Điều dưỡng',
            },
            {
                username: 'family1',
                email: 'family@example.com',
                phone: '0000000002',
                password: await bcrypt.hash('family123', 10),
                full_name: 'Family Member',
                role: user_schema_1.UserRole.FAMILY,
                relationship: 'con trai',
            },
        ];
        try {
            await this.userModel.insertMany(users);
            console.log('Seeded default users successfully');
            console.log('Admin: admin@example.com / admin123');
            console.log('Staff: staff@example.com / staff123');
            console.log('Family: family@example.com / family123');
        }
        catch (error) {
            console.error('Error seeding users:', error);
        }
    }
};
exports.DatabaseSeeder = DatabaseSeeder;
exports.DatabaseSeeder = DatabaseSeeder = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DatabaseSeeder);
//# sourceMappingURL=seeder.js.map