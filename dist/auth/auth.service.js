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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const bcrypt = require("bcryptjs");
const user_schema_1 = require("../users/schemas/user.schema");
let AuthService = class AuthService {
    usersService;
    jwtService;
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(password, user.password))) {
            const { password, ...result } = user.toObject();
            return result;
        }
        return null;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = {
            email: user.email,
            sub: user._id.toString(),
            role: user.role,
            username: user.username
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
            }
        };
    }
    async register(registerDto) {
        if (registerDto.password !== registerDto.confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        const { confirmPassword, ...createUserDto } = registerDto;
        createUserDto.role = user_schema_1.UserRole.FAMILY;
        const user = await this.usersService.create(createUserDto);
        const payload = {
            email: user.email,
            sub: user._id.toString(),
            role: user.role,
            username: user.username
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user._id.toString(),
                email: user.email,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map