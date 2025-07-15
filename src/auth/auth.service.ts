import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../common/enums/role.enum';
import { UserRole, UserStatus } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.status === UserStatus.ACTIVE &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user._id.toString(),
      role: user.role,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const { confirmPassword, ...createUserDto } = registerDto;

    // Default role is FAMILY_MEMBER for registration
    createUserDto.role = UserRole.FAMILY;

    const user = await this.usersService.create(createUserDto);

    const payload = {
      email: user.email,
      sub: (user as any)._id.toString(),
      role: user.role,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: (user as any)._id.toString(),
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }
}
