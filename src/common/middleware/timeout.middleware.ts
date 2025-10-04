import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 🚀 OPTIMIZATION: Increase timeout for file uploads and heavy operations
    const timeout = 60000; // 60 seconds
    
    // Set timeout for the request
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout. Please try again with smaller files or check your connection.',
          error: 'TIMEOUT',
        });
      }
    });

    // Set timeout for the response
    res.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Response timeout. The server is taking too long to process your request.',
          error: 'RESPONSE_TIMEOUT',
        });
      }
    });

    next();
  }
}
