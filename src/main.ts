import * as dotenv from 'dotenv';
import * as path from 'path';
// Reszta importów
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Ścieżka do pliku .env:', envPath);

dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV');
  const port = configService.get('PORT');

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? ['https://your-production-domain.com']
        : 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(port, () => {
    console.log(`Running API in MODE: ${nodeEnv} on Port: ${port}`);
  });
}

bootstrap().catch(error => {
  console.error('Błąd podczas uruchamiania aplikacji:', error);
  process.exit(1);
});
