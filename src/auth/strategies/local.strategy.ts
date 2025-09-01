import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
      }
      return user;
    } catch (error) {
      // Re-throw UnauthorizedException với thông báo chi tiết
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Xử lý các lỗi khác
      throw new UnauthorizedException(
        'Có lỗi xảy ra khi xác thực. Vui lòng thử lại sau.',
      );
    }
  }
}
