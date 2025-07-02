import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            username: any;
            full_name: any;
            role: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: string;
            username: string;
            full_name: string;
            role: import("../users/schemas/user.schema").UserRole;
        };
    }>;
}
