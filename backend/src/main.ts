// Memuat backend/.env sebelum config dibaca. Wajib baris pertama.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { join } from 'path';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { assertSecureAuthConfig, authConfig } from './config/auth.config';

async function bootstrap() {
  // Refuse to boot in production with default secrets, no database, or insecure cookies.
  assertSecureAuthConfig();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const logger = new Logger('Bootstrap');

  // Correct client IP behind NGINX for rate limiting. Defaults to loopback-only trust.
  app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');
  app.disable('x-powered-by');

  // Small JSON bodies only: auth payloads are tiny, large bodies are a DoS vector.
  app.useBodyParser('json', { limit: '32kb' });
  app.useBodyParser('urlencoded', { limit: '32kb', extended: false });
  app.use(cookieParser());

  // Correlates client-visible error ids with server logs.
  app.use((req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  });

  // Security headers. CSP allows inline script/style only because the internal staff views
  // (KDS, admin) on this port are self-contained HTML; the public frontend lives on :3000.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
          'script-src-attr': ["'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'blob:'],
          'connect-src': ["'self'", 'ws:', 'wss:'],
          'frame-ancestors': ["'none'"],
          'form-action': ["'self'"],
          'object-src': ["'none'"],
          'upgrade-insecure-requests': authConfig.isProduction ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: authConfig.isProduction ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
    }),
  );

  // Strict CORS: only allow-listed frontend origins may make credentialed requests.
  app.enableCors({
    origin: (origin, callback) => {
      // No Origin header = same-origin navigation, server-to-server or curl. Not a CORS request.
      if (!origin || authConfig.cors.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'Retry-After'],
    maxAge: 600,
  });

  // Serve static assets from public folder (images, icons, etc.)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Legacy class-validator DTOs on existing modules. New auth routes validate with Zod pipes.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Centralised error handling. Stack traces are logged, never returned.
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`[NutriDaily Core API & WebSocket Server] running on http://localhost:${port}`);
  logger.log(`[KDS Gateway] listening on ws://localhost:${port}/kds`);
  logger.log(`[CORS] allowed origins: ${authConfig.cors.allowedOrigins.join(', ')}`);
}

bootstrap();
