import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - payload:', payload);
    console.log('JWT Strategy - payload.sub:', payload.sub);
    console.log('JWT Strategy - payload.email:', payload.email);

    const result = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      username: payload.username,
    };

    console.log('JWT Strategy - result:', result);
    return result;
  }
}
