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
exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const user_schema_1 = require("../schemas/user.schema");
class CreateUserDto {
    username;
    email;
    password;
    full_name;
    phone;
    role;
    avatar;
    is_super_admin;
    position;
    qualification;
    join_date;
    relationship;
    residents;
    address;
    notes;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john_doe', description: 'Tên đăng nhập' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com', description: 'Email người dùng' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', minLength: 6, description: 'Mật khẩu' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', description: 'Họ và tên người dùng' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "full_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0901234567', description: 'Số điện thoại' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: user_schema_1.UserRole, example: user_schema_1.UserRole.STAFF, description: 'Vai trò người dùng' }),
    (0, class_validator_1.IsEnum)(user_schema_1.UserRole),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg', description: 'URL ảnh đại diện' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false, description: 'Là super admin?' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "is_super_admin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Điều dưỡng', description: 'Chức vụ' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Cử nhân Điều dưỡng', description: 'Bằng cấp' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "qualification", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2023-01-15', description: 'Ngày vào làm' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateUserDto.prototype, "join_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: user_schema_1.Relationship, example: user_schema_1.Relationship.SON, description: 'Mối quan hệ' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(user_schema_1.Relationship),
    __metadata("design:type", String)
], CreateUserDto.prototype, "relationship", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['60d...'], description: 'Danh sách ID người thân' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    __metadata("design:type", Array)
], CreateUserDto.prototype, "residents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123 Main St, City, Country', description: 'Địa chỉ' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ghi chú về người dùng', description: 'Ghi chú' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "notes", void 0);
//# sourceMappingURL=create-user.dto.js.map