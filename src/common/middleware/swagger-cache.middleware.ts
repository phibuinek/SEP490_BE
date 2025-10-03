import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SwaggerCacheMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Cache Swagger static assets for 1 hour
    if (req.url.includes('/api') && (
        req.url.includes('.js') || 
        req.url.includes('.css') || 
        req.url.includes('.png') || 
        req.url.includes('.ico')
    )) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    
    // Cache API JSON for 5 minutes
    if (req.url.includes('api-json')) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    
    next();
  }
}

