import type { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:19006',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

export class ConfiguredSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly config: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const configured =
      this.config
        .get<string>('CORS_ORIGIN')
        ?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [];
    const origins = [
      ...new Set([
        ...configured,
        ...(this.config.get<string>('NODE_ENV') === 'production'
          ? []
          : developmentOrigins),
      ]),
    ];
    return super.createIOServer(port, {
      ...options,
      cors: { origin: origins, credentials: true },
    }) as Server;
  }
}
