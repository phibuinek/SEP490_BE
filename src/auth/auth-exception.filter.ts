import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.getResponse();

    // Xử lý lỗi authentication
    if (status === HttpStatus.UNAUTHORIZED) {
      let errorMessage = 'Thông tin đăng nhập không chính xác';

      // Kiểm tra message từ exception
      if (typeof message === 'string') {
        errorMessage = message;
      } else if (typeof message === 'object' && 'message' in message) {
        if (Array.isArray(message['message'])) {
          errorMessage = message['message'][0] as string;
        } else {
          errorMessage = message['message'] as string;
        }
      }

      return response.status(status).json({
        statusCode: status,
        message: errorMessage,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
      });
    }

    // Xử lý các lỗi khác
    const errorResponse = {
      statusCode: status,
      message:
        typeof message === 'string'
          ? message
          : (message as any)['message'] || 'Internal server error',
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    };

    response.status(status).json(errorResponse);
  }
}
