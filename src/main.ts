import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { json } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { getAuth } from './auth/auth-instance';
import { AppModule } from './app.module';

function addBetterAuthSwaggerPaths(document: OpenAPIObject) {
  const paths = document.paths ?? {};

  paths['/api/auth/token'] = {
    get: {
      tags: ['better-auth'],
      summary: 'Get a JWT token for the current authenticated session',
      description:
        'Returns a JWT issued by Better Auth for the currently authenticated session.',
      security: [{ bearer: [] }],
      responses: {
        200: { description: 'JWT returned successfully' },
        401: { description: 'Current session is missing or invalid' },
      },
    },
  };

  paths['/api/auth/jwks'] = {
    get: {
      tags: ['better-auth'],
      summary: 'Get the JWKS used to verify Better Auth JWTs',
      responses: {
        200: { description: 'JWKS returned successfully' },
      },
    },
  };

  paths['/api/auth/callback/google'] = {
    get: {
      tags: ['better-auth'],
      summary: 'OAuth callback endpoint used internally by Better Auth for Google login',
      responses: {
        302: { description: 'Redirect after successful Google authentication' },
        400: { description: 'Invalid OAuth callback request' },
      },
    },
  };

  document.paths = paths;

  const tags = (document.tags ?? []).slice();
  if (!tags.some((tag) => tag.name === 'better-auth')) {
    tags.push({
      name: 'better-auth',
      description: 'Better Auth endpoints mounted outside Nest controllers',
    });
  }
  document.tags = tags;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/*splat', toNodeHandler(getAuth()));
  expressApp.use(json());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OSUT Backend API')
    .setDescription('Backend API for OSUT Cluj')
    .setVersion('1.0.0')
    .addBearerAuth(undefined, 'bearer')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  addBetterAuthSwaggerPaths(document);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
