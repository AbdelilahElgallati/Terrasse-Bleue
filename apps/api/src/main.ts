import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureSecurity } from './configure-security';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configureSecurity(app);
  app.useBodyParser('json', { limit: '3mb' });
  app.useBodyParser('urlencoded', { limit: '3mb', extended: true });

  const port = process.env.PORT ?? 3001;
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);
}

void bootstrap();
