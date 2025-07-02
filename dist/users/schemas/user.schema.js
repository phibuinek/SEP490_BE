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
exports.UserSchema = exports.User = exports.Relationship = exports.UserRole = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["STAFF"] = "staff";
    UserRole["FAMILY"] = "family";
})(UserRole || (exports.UserRole = UserRole = {}));
var Relationship;
(function (Relationship) {
    Relationship["SON"] = "con trai";
    Relationship["DAUGHTER"] = "con g\u00E1i";
    Relationship["GRANDSON"] = "ch\u00E1u trai";
    Relationship["GRANDDAUGHTER"] = "ch\u00E1u g\u00E1i";
    Relationship["SIBLING"] = "anh em";
    Relationship["SPOUSE"] = "v\u1EE3/ch\u1ED3ng";
    Relationship["OTHER"] = "kh\u00E1c";
})(Relationship || (exports.Relationship = Relationship = {}));
let User = class User {
    full_name;
    email;
    phone;
    username;
    password;
    avatar;
    role;
    is_super_admin;
    position;
    qualification;
    join_date;
    relationship;
    residents;
    address;
    notes;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, maxlength: 100 }),
    __metadata("design:type", String)
], User.prototype, "full_name", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, match: /^[0-9]{10,15}$/ }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9_]{3,30}$/,
    }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, minlength: 6 }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], User.prototype, "avatar", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: UserRole }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "is_super_admin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], User.prototype, "position", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], User.prototype, "qualification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], User.prototype, "join_date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Relationship }),
    __metadata("design:type", String)
], User.prototype, "relationship", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Schema.Types.ObjectId, ref: 'Resident' }] }),
    __metadata("design:type", Array)
], User.prototype, "residents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], User.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], User.prototype, "notes", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
//# sourceMappingURL=user.schema.js.map