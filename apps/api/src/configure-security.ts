import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { ConfiguredSocketIoAdapter } from './realtime/configured-socket-io.adapter';

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:19006',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

export function configureSecurity(app: NestExpressApplication) {
  const config = app.get(ConfigService);
  const configuredOrigins =
    config
      .get<string>('CORS_ORIGIN')
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  const allowedOrigins = [
    ...configuredOrigins,
    ...(config.get<string>('NODE_ENV') === 'production'
      ? []
      : developmentOrigins),
  ];
  app.useWebSocketAdapter(new ConfiguredSocketIoAdapter(app, config));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: [...new Set(allowedOrigins)],
    credentials: true,
  });
}
