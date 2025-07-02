import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.isActive && await bcrypt.compare(password, user.password)) {
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
      roles: user.roles,
      username: user.username
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles: user.roles,
      }
    };
  }

  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const { confirmPassword, ...createUserDto } = registerDto;
    
    // Default role is FAMILY_MEMBER for registration
    createUserDto.roles = [Role.FAMILY_MEMBER];
    
    const user = await this.usersService.create(createUserDto);
    
    const payload = { 
      email: user.email, 
      sub: (user as any)._id.toString(), 
      roles: user.roles,
      username: user.username
    };
    
         return {
       access_token: this.jwtService.sign(payload),
       user: {
         id: (user as any)._id.toString(),
         email: user.email,
         username: user.username,
         fullName: user.fullName,
         roles: user.roles,
       }
     };
  }
} 