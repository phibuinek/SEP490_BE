import * as dotenv from 'dotenv';

// Chỉ load .env khi chạy local
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Memory optimization for production
if (process.env.NODE_ENV === 'production') {
  require('../optimize-memory');
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['log', 'debug', 'error', 'warn'],
  });

  // Enable CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [
            process.env.APP_URL || 'https://carehome-system.vercel.app',
            'https://carehome-system.vercel.app',
          ].filter(Boolean)
        : 'http://localhost:3000',
    credentials: true,
  });

  // Global exception filter for user-friendly error messages
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      skipMissingProperties: true,
    }),
  );

  // Serve static files from uploads
  // In production, serve from /tmp/uploads, locally from ./uploads
  const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
  const uploadsDir = isProd ? '/tmp/uploads' : join(__dirname, '..', 'uploads');
  
  console.log('Static file serving configuration:');
  console.log('- Is production:', isProd);
  console.log('- Uploads directory:', uploadsDir);
  console.log('- Static prefix: /uploads/');
  
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });
  
  console.log('✅ Static file serving configured successfully');

  // Swagger configuration - chỉ enable khi không phải production hoặc có ENABLE_SWAGGER=true
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Family Management API')
      .setDescription('API for family management system with role-based authentication')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    });
    
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'none', // Không expand tất cả endpoints
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
      },
      customSiteTitle: 'Family Management API',
      customfavIcon: '/favicon-32x32.png',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      ],
      customCssUrl: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      ],
    });
    
    console.log(`Swagger documentation: http://localhost:${process.env.PORT ?? 8000}/api`);
  } else {
    console.log('Swagger disabled in production');
  }

  const port = process.env.PORT ?? 8000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
