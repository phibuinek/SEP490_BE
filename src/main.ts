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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Family Management API')
    .setDescription(
      'API for family management system with role-based authentication',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 8000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port: ${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
